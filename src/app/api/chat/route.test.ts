import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { POST } from "./route";

const originalKey = process.env.GEMINI_API_KEY;
const originalAstreyaKey = process.env.ASTREYA_API_KEY;

describe("POST /api/chat", () => {
  beforeEach(() => {
    delete process.env.ASTREYA_API_KEY;
  });

  afterEach(() => {
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
    if (originalAstreyaKey === undefined) delete process.env.ASTREYA_API_KEY;
    else process.env.ASTREYA_API_KEY = originalAstreyaKey;
    vi.unstubAllGlobals();
  });

  it("returns 400 on invalid JSON body", async () => {
    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      body: "not-json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when messages are missing or invalid", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 503 without GEMINI_API_KEY", async () => {
    delete process.env.GEMINI_API_KEY;
    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: "hello" }] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toMatch(/GEMINI_API_KEY/i);
  });

  it("returns SSE stream shape when upstream succeeds", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          `data: ${JSON.stringify({ choices: [{ delta: { content: "Hi" } }] })}\n\ndata: [DONE]\n\n`,
          {
            status: 200,
            headers: { "Content-Type": "text/event-stream" },
          },
        ),
      ),
    );

    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "hello" }],
        stream: true,
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/event-stream");
    const text = await res.text();
    expect(text).toContain("data:");
  });

  it("returns 401 when ASTREYA_API_KEY is set and request is unauthorized", async () => {
    process.env.ASTREYA_API_KEY = "secret";
    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: "hello" }] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});
