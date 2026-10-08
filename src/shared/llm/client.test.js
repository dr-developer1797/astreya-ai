import { describe, expect, it } from "vitest";
import { describeFailure, extractStreamEvent } from "./client";

describe("describeFailure", () => {
  it("does not expose an HTML proxy error body", async () => {
    const res = new Response("<!doctype html><html><body>Gateway internals</body></html>", {
      status: 504,
      headers: { "Content-Type": "text/html" },
    });

    await expect(describeFailure(res)).resolves.toBe(
      "The AI service timed out. Please try again.",
    );
  });

  it("preserves useful JSON API errors", async () => {
    const res = Response.json({ error: "Conversation is too long." }, { status: 413 });

    await expect(describeFailure(res)).resolves.toBe(
      "API 413 — Conversation is too long.",
    );
  });
});

describe("extractStreamEvent", () => {
  it("distinguishes errors from generated text", () => {
    expect(extractStreamEvent('{"error":"quota exceeded"}')).toEqual({
      chunk: "",
      error: "quota exceeded",
    });
    expect(
      extractStreamEvent('{"choices":[{"delta":{"content":"Legal answer"}}]}'),
    ).toEqual({ chunk: "Legal answer", error: "" });
  });
});
