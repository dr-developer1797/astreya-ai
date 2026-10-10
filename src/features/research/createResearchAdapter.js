import { callLLM, extractStreamEvent } from "@/shared/llm/client";
import { createAbortError, isAbortError } from "@/shared/llm/errors";
import { buildIkContext, fetchIkSources } from "@/shared/llm/ikContext";

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
          const demoMeta = {
            ikSources: [],
            ikGrounded: true,
            ikError: "",
          };
          for (let i = 0; i < demoText.length; i++) {
            if (abortSignal?.aborted) throw createAbortError();
            acc += demoText[i];
            if (i % 4 === 0 || i === demoText.length - 1) {
              yield {
                content: [{ type: "text", text: acc }],
                metadata: { custom: demoMeta },
              };
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
      let ikWarning = "";
      try {
        const ik = await fetchIkSources(lastUser.content, { signal: abortSignal });
        ikDocs = ik.sources;
        ikWarning = ik.warning || "";
        handlers.onIkResult?.({
          sources: ikDocs,
          grounded: ikDocs.length > 0,
          error: ik.warning,
          messageId: lastUser.id,
        });
      } catch (err) {
        if (isAbortError(err) || abortSignal?.aborted) throw createAbortError();
        ikWarning = `IndianKanoon unavailable (${err.message}) — answering without retrieved authority.`;
        handlers.onIkResult?.({
          sources: [],
          grounded: false,
          error: ikWarning,
          messageId: lastUser.id,
        });
      } finally {
        handlers.onIkDone?.();
      }

      const sourceMeta = {
        ikSources: ikDocs,
        ikGrounded: ikDocs.length > 0,
        ikError: ikWarning,
      };

      if (abortSignal?.aborted) throw createAbortError();

      const apiMessages = [
        ...plain.slice(0, -1),
        { role: "user", content: lastUser.content + buildIkContext(ikDocs) },
      ];

      const res = await callLLM({
        feature: "research",
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
              yield {
                content: [{ type: "text", text: full }],
                metadata: { custom: sourceMeta },
              };
            }
          }
        }
        buffer += decoder.decode();
        if (buffer.trim()) {
          for (const line of buffer.split("\n")) {
            const before = full.length;
            consumeLine(line);
            if (full.length > before) {
              yield {
                content: [{ type: "text", text: full }],
                metadata: { custom: sourceMeta },
              };
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
