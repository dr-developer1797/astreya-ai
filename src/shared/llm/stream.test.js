import { describe, it, expect, vi, beforeEach } from "vitest";
import { streamChatCompletion } from "./stream";
import { isAbortError } from "./errors";

const callLLM = vi.fn();
const extractChunk = vi.fn((raw) => {
  try {
    const p = JSON.parse(raw);
    return p.choices?.[0]?.delta?.content ?? "";
  } catch {
    return "";
  }
});

vi.mock("./client", () => ({
  callLLM: (...args) => callLLM(...args),
  extractChunk: (raw) => extractChunk(raw),
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
    extractChunk.mockClear();
  });

  it("returns full text on clean completion", async () => {
    callLLM.mockResolvedValue({
      body: sseBody(["Hello", " world"]),
    });

    const full = await streamChatCompletion({
      sys: "test",
      messages: [{ role: "user", content: "hi" }],
    });

    expect(full).toBe("Hello world");
  });

  it("throws AbortError when signal is aborted before start", async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      streamChatCompletion({
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
        messages: [{ role: "user", content: "hi" }],
        signal: controller.signal,
      }),
    ).rejects.toSatisfy(isAbortError);
  });
});
