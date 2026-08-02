import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { POST, normalizeQuery } from "./route";

const originalIkKey = process.env.INDIAN_KANOON_API_KEY;
const originalAstreyaKey = process.env.ASTREYA_API_KEY;

describe("normalizeQuery", () => {
  it("expands CrPC abbreviation and extracts section anchor", () => {
    const result = normalizeQuery("Can FIR be quashed under S.482 CrPC?");
    expect(result.search.toLowerCase()).toContain("criminal procedure");
    expect(result.anchor).toBe("Section 482");
    expect(result.statute.toLowerCase()).toContain("section 482");
  });

  it("preserves a usable search string for plain queries", () => {
    const result = normalizeQuery("cheque bounce procedure");
    expect(result.search.length).toBeGreaterThan(0);
    expect(result.search.toLowerCase()).toContain("cheque");
  });
});

describe("POST /api/legal-search", () => {
  beforeEach(() => {
    delete process.env.ASTREYA_API_KEY;
  });

  afterEach(() => {
    if (originalIkKey === undefined) delete process.env.INDIAN_KANOON_API_KEY;
    else process.env.INDIAN_KANOON_API_KEY = originalIkKey;
    if (originalAstreyaKey === undefined) delete process.env.ASTREYA_API_KEY;
    else process.env.ASTREYA_API_KEY = originalAstreyaKey;
  });

  it("returns 400 on invalid JSON", async () => {
    const req = new Request("http://localhost/api/legal-search", {
      method: "POST",
      body: "{",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when query is missing", async () => {
    const req = new Request("http://localhost/api/legal-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns unconfigured payload when IK key is absent", async () => {
    delete process.env.INDIAN_KANOON_API_KEY;
    delete process.env.IndiaKanoon_API_KEY;
    const req = new Request("http://localhost/api/legal-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "bail under NDPS Act" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.configured).toBe(false);
    expect(body.sources).toEqual([]);
    expect(body.degraded).toBe(false);
  });
});
