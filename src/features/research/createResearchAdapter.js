import { callLLM, extractStreamEvent } from "@/shared/llm/client";
import { createAbortError, isAbortError } from "@/shared/llm/errors";
import { RESEARCH_SYSTEM } from "@/features/research/prompts";

function messageText(message) {
  if (!message?.content) return "";
  return message.content
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n");
}

export function toPlainMessages(messages) {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role, content: messageText(m) }))
    .filter((m) => m.content.trim().length > 0);
}

function formatSource(d) {
  const lines = [`[${d.ref}] ${d.title}`];
  if (d.citation) lines.push(`    Reported at: ${d.citation}`);
  lines.push(`    Source: ${d.court || "N/A"} | Date: ${d.date || "N/A"} | Cited by ${d.citedBy} documents`);
  lines.push(`    URL: ${d.url}`);
  if (d.fullText) lines.push(`    Query-matched excerpt: ${d.fullText}`);
  else if (d.snippet) lines.push(`    Matched passage: ${d.snippet}`);
  return lines.join("\n");
}

function buildIkContext(ikDocs) {
  if (!ikDocs.length) return "";
  const statutes = ikDocs.filter((d) => d.kind === "statute");
  const rulings = ikDocs.filter((d) => d.kind !== "statute");
  return (
    "\n\n--- RETRIEVED SOURCES FROM INDIANKANOON ---\n" +
    [
      statutes.length ? "STATUTORY PROVISIONS:\n" + statutes.map(formatSource).join("\n\n") : "",
      rulings.length ? "JUDGMENTS:\n" + rulings.map(formatSource).join("\n\n") : "",
    ]
      .filter(Boolean)
      .join("\n\n") +
    "\n--- END RETRIEVED SOURCES ---"
  );
}

async function delay(ms, signal) {
  if (signal?.aborted) throw createAbortError();
  await new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(createAbortError());
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/**
 * LocalRuntime ChatModelAdapter: Indian Kanoon retrieval, then Gemma SSE stream.
 * Optional one-shot demo script via getDemoText().
 */
export function createResearchAdapter({ getHandlers, getDemoText }) {
  return {
    async *run({ messages, abortSignal }) {
      const handlers = getHandlers?.() ?? {};
      const demoText = getDemoText?.();

      if (demoText) {
        handlers.onDemoStart?.();
        let acc = "";
        try {
          for (let i = 0; i < demoText.length; i++) {
            if (abortSignal?.aborted) throw createAbortError();
            acc += demoText[i];
            if (i % 4 === 0 || i === demoText.length - 1) {
              yield { content: [{ type: "text", text: acc }] };
              await delay(8, abortSignal);
            }
          }
        } finally {
          handlers.onDemoDone?.();
        }
        return;
      }

      const plain = toPlainMessages(messages);
      const lastUser = [...plain].reverse().find((m) => m.role === "user");
      if (!lastUser) return;

      handlers.onIkStart?.(lastUser.content);

      let ikDocs = [];
      try {
        const ikRes = await fetch("/api/legal-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: lastUser.content, page: 0 }),
          signal: abortSignal,
        });
        const ikJson = await ikRes.json().catch(() => ({}));
        if (!ikRes.ok) throw new Error(ikJson.error || `Search failed (${ikRes.status})`);

        ikDocs = Array.isArray(ikJson.sources)
          ? ikJson.sources.map((d, i) => ({ ...d, ref: i + 1 }))
          : [];

        let ikError = "";
        if (ikJson.configured === false) {
          ikError = "Case-law search is not configured — answering from the model's own knowledge only.";
        } else if (ikDocs.length === 0) {
          ikError = "No IndianKanoon match for this query — answering without retrieved authority.";
        } else if (ikJson.degraded) {
          ikError = "Part of IndianKanoon did not respond — results may be incomplete.";
        }

        handlers.onIkResult?.({
          sources: ikDocs,
          grounded: ikDocs.length > 0,
          error: ikError,
        });
      } catch (err) {
        if (isAbortError(err) || abortSignal?.aborted) throw createAbortError();
        handlers.onIkResult?.({
          sources: [],
          grounded: false,
          error: `IndianKanoon unavailable (${err.message}) — answering without retrieved authority.`,
        });
      } finally {
        handlers.onIkDone?.();
      }

      if (abortSignal?.aborted) throw createAbortError();

      const apiMessages = [
        ...plain.slice(0, -1),
        { role: "user", content: lastUser.content + buildIkContext(ikDocs) },
      ];

      const res = await callLLM({
        sys: RESEARCH_SYSTEM,
        messages: apiMessages,
        stream: true,
        signal: abortSignal,
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      let buffer = "";

      const consumeLine = (line) => {
        if (!line.startsWith("data:")) return;
        const raw = line.slice(5).trimStart().trim();
        if (!raw || raw === "[DONE]") return;
        const event = extractStreamEvent(raw);
        if (event.error) throw new Error(event.error);
        if (event.chunk) full += event.chunk;
      };

      try {
        while (true) {
          if (abortSignal?.aborted) {
            try { await reader.cancel(); } catch { /* ignore */ }
            throw createAbortError();
          }
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const before = full.length;
            consumeLine(line);
            if (full.length > before) {
              yield { content: [{ type: "text", text: full }] };
            }
          }
        }
        buffer += decoder.decode();
        if (buffer.trim()) {
          for (const line of buffer.split("\n")) {
            const before = full.length;
            consumeLine(line);
            if (full.length > before) {
              yield { content: [{ type: "text", text: full }] };
            }
          }
        }
      } catch (err) {
        if (isAbortError(err) || abortSignal?.aborted) throw createAbortError();
        throw err;
      }
    },
  };
}
