import { callLLM, extractChunk } from "./client";

export async function streamChatCompletion({ sys, messages, onToken, signal }) {
  const res = await callLLM({ sys, messages, stream: true });
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (signal?.aborted) { try { await reader.cancel(); } catch {} break; }
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
  return full;
}
