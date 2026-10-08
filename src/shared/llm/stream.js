import { callLLM, extractStreamEvent } from "./client";
import { createAbortError } from "./errors";

function throwIfAborted(signal) {
  if (signal?.aborted) throw createAbortError();
}

export async function streamChatCompletion({ sys, messages, onToken, signal }) {
  throwIfAborted(signal);
  const res = await callLLM({ sys, messages, stream: true, signal });
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  let buffer = "";

  const consumeLine = (line) => {
    if (!line.startsWith("data:")) return false;
    const raw = line.slice(5).trimStart().trim();
    if (!raw) return false;
    if (raw === "[DONE]") return true;
    const event = extractStreamEvent(raw);
    if (event.error) throw new Error(event.error);
    if (event.chunk) {
      full += event.chunk;
      onToken?.(full, event.chunk);
    }
    return false;
  };

  while (true) {
    throwIfAborted(signal);
    const { done, value } = await reader.read();
    if (done) break;
    if (signal?.aborted) {
      try { await reader.cancel(); } catch { /* ignore */ }
      throw createAbortError();
    }
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      consumeLine(line);
    }
  }
  throwIfAborted(signal);
  buffer += decoder.decode();
  if (buffer.trim()) {
    for (const line of buffer.split("\n")) {
      consumeLine(line);
    }
  }
  throwIfAborted(signal);
  return full;
}
