import { callLLM, extractChunk } from "./client";
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
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6).trim();
      if (raw === "[DONE]") continue;
      const chunk = extractChunk(raw);
      if (chunk) {
        full += chunk;
        onToken?.(full, chunk);
      }
    }
  }
  throwIfAborted(signal);
  buffer += decoder.decode();
  if (buffer.trim()) {
    for (const line of buffer.split("\n")) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6).trim();
      if (raw === "[DONE]") continue;
      const chunk = extractChunk(raw);
      if (chunk) {
        full += chunk;
        onToken?.(full, chunk);
      }
    }
  }
  throwIfAborted(signal);
  return full;
}
