import { afterEach, describe, expect, it, vi } from "vitest";
import { isAbortError } from "@/shared/llm/errors";
import { createResearchAdapter } from "./createResearchAdapter";

const callLLM = vi.fn();

vi.mock("@/shared/llm/client", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    callLLM: (...args) => callLLM(...args),
  };
});

const messages = [
  { role: "user", content: [{ type: "text", text: "What is anticipatory bail?" }] },
];

describe("createResearchAdapter", () => {
  afterEach(() => {
    callLLM.mockReset();
    vi.unstubAllGlobals();
  });

  it("always clears Indian Kanoon loading when retrieval is cancelled", async () => {
    const controller = new AbortController();
    const onIkDone = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn((_url, init) => new Promise((_resolve, reject) => {
        init.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
      })),
    );
    const adapter = createResearchAdapter({
      getHandlers: () => ({ onIkDone }),
    });

    const next = adapter.run({ messages, abortSignal: controller.signal }).next();
    controller.abort();

    await expect(next).rejects.toSatisfy(isAbortError);
    expect(onIkDone).toHaveBeenCalledOnce();
  });

  it("rejects server SSE errors instead of yielding them as answer text", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ sources: [], configured: false, degraded: false })),
    );
    const encoder = new TextEncoder();
    callLLM.mockResolvedValue({
      body: new ReadableStream({
        start(streamController) {
          streamController.enqueue(
            encoder.encode('event: error\ndata: {"error":"model overloaded"}\n\n'),
          );
          streamController.close();
        },
      }),
    });
    const adapter = createResearchAdapter({ getHandlers: () => ({}) });

    const consume = async () => {
      for await (const value of adapter.run({ messages })) {
        void value;
        // The error frame must never become a yielded assistant message.
      }
    };

    await expect(consume()).rejects.toThrow("model overloaded");
  });
});
