import { describe, it, expect, vi, beforeEach } from "vitest";
import { streamChatCompletion } from "./stream";
import { isAbortError } from "./errors";

const callLLM = vi.fn();
const extractStreamEvent = vi.fn((raw) => {
  try {
    const p = JSON.parse(raw);
    return {
      chunk: p.choices?.[0]?.delta?.content ?? "",
      error: typeof p.error === "string" ? p.error : "",
    };
  } catch {
    return { chunk: "", error: "" };
  }
});

vi.mock("./client", () => ({
  callLLM: (...args) => callLLM(...args),
  extractStreamEvent: (raw) => extractStreamEvent(raw),
}));

function sseBody(chunks) {
  const encoder = new TextEncoder();
  const lines = chunks.flatMap((text) => [
    `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n`,
    "\n",
  ]);
  lines.push("data: [DONE]\n\n");
  let i = 0;
  return new ReadableStream({
    pull(controller) {
      if (i >= lines.length) {
        controller.close();
        return;
      }
      controller.enqueue(encoder.encode(lines[i++]));
    },
  });
}

describe("streamChatCompletion", () => {
  beforeEach(() => {
    callLLM.mockReset();
    extractStreamEvent.mockClear();
  });

  it("returns full text on clean completion", async () => {
    callLLM.mockResolvedValue({
      body: sseBody(["Hello", " world"]),
    });

    const full = await streamChatCompletion({
      feature: "research",
      messages: [{ role: "user", content: "hi" }],
    });

    expect(full).toBe("Hello world");
  });

  it("throws AbortError when signal is aborted before start", async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      streamChatCompletion({
        feature: "research",
        messages: [{ role: "user", content: "hi" }],
        signal: controller.signal,
      }),
    ).rejects.toSatisfy(isAbortError);
  });

  it("throws AbortError when signal aborts mid-stream", async () => {
    const controller = new AbortController();
    callLLM.mockResolvedValue({
      body: sseBody(["partial"]),
    });

    controller.abort();

    await expect(
      streamChatCompletion({
        feature: "research",
        messages: [{ role: "user", content: "hi" }],
        signal: controller.signal,
      }),
    ).rejects.toSatisfy(isAbortError);
  });

  it("throws when the server sends an SSE error payload", async () => {
    const encoder = new TextEncoder();
    callLLM.mockResolvedValue({
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('event: error\ndata: {"error":"quota exceeded"}\n\n'));
          controller.close();
        },
      }),
    });

    await expect(
      streamChatCompletion({
        feature: "research",
        messages: [{ role: "user", content: "hi" }],
      }),
    ).rejects.toThrow("quota exceeded");
  });
});
