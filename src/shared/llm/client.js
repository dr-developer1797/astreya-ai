import { isAbortError } from "./errors";
import { FEATURES } from "./features";

// Turns a non-2xx response into a message that names the actual failure.
export async function describeFailure(res) {
  let detail = "";
  try {
    const text = await res.text();
    const contentType = res.headers?.get?.("content-type") || "";
    const looksLikeHtml = contentType.includes("text/html") || /^\s*<!doctype html|^\s*<html/i.test(text);
    if (looksLikeHtml) {
      if (res.status === 504) return "The AI service timed out. Please try again.";
      if (res.status >= 500) return "The AI service is temporarily unavailable. Please try again.";
      return `The request failed (API ${res.status}). Please try again.`;
    }
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

/**
 * Call /api/chat with a server-registered feature id.
 * System prompts and token budgets are resolved on the server — never sent from the client.
 */
export async function callLLM({
  feature,
  featureOpts,
  messages,
  stream = true,
  signal,
}) {
  if (!feature || !FEATURES[feature]) {
    throw new Error("A valid Astreya feature id is required.");
  }

  const init = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      feature,
      featureOpts,
      messages,
      stream,
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

// Parses one data payload from the app's SSE protocol.
export function extractStreamEvent(raw) {
  try {
    const payload = JSON.parse(raw);
    const error = payload?.error?.message ?? payload?.error;
    if (typeof error === "string" && error.trim()) {
      return { chunk: "", error: error.trim() };
    }
    return {
      chunk: typeof payload?.choices?.[0]?.delta?.content === "string"
        ? payload.choices[0].delta.content
        : "",
      error: "",
    };
  } catch {
    return { chunk: "", error: "" };
  }
}

// Extracts content from a non-streaming OpenAI-format response object.
export function extractResponse(data) {
  return data.choices?.[0]?.message?.content ?? "";
}
