import { isAbortError } from "./errors";

// Raising this does not buy a longer document: the model's hidden thought step expands to
// fill whatever budget it is given (at 2400 it ran ~43s before any text appeared, versus
// ~31s at 2000, and no run of nine reached a signature block), and 2400 tokens already
// takes ~53s of generation against the 60s function ceiling.
export const MAX_TOKENS = 2000;

// Turns a non-2xx response into a message that names the actual failure.
export async function describeFailure(res) {
  let detail = "";
  try {
    const text = await res.text();
    try {
      const parsed = JSON.parse(text);
      detail = parsed?.error?.message ?? parsed?.error ?? text;
    } catch {
      detail = text;
    }
  } catch { /* body unreadable */ }
  if (typeof detail !== "string") detail = JSON.stringify(detail);
  detail = detail.trim();
  return detail ? `API ${res.status} — ${detail.slice(0, 300)}` : `API ${res.status}`;
}

export async function callLLM({ sys, messages, stream = true, signal }) {
  const init = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      sys,
      stream,
      max_tokens: MAX_TOKENS,
    }),
    signal,
  };

  let res;
  try {
    res = await fetch("/api/chat", init);
  } catch (err) {
    if (isAbortError(err)) throw err;
    throw new Error("Could not reach the Astreya Gemma API — check the deployment and try again");
  }
  if (!res.ok) throw new Error(await describeFailure(res));
  return res;
}

// Extracts text from one OpenAI-format SSE chunk. Returns "" if nothing.
export function extractChunk(raw) {
  try { const p = JSON.parse(raw); return p.choices?.[0]?.delta?.content ?? ""; }
  catch { return ""; }
}

// Extracts content from a non-streaming OpenAI-format response object.
export function extractResponse(data) {
  return data.choices?.[0]?.message?.content ?? "";
}
