import { describe, expect, it } from "vitest";
import { isFeatureId, resolveFeature } from "./features";

describe("feature registry", () => {
  it("rejects unknown feature ids", () => {
    expect(isFeatureId("research")).toBe(true);
    expect(isFeatureId("hack")).toBe(false);
  });

  it("resolves per-feature system prompts and token budgets", () => {
    const draft = resolveFeature("draft", { docLabel: "NDA" });
    expect(draft.maxTokens).toBeGreaterThan(2000);
    expect(draft.system).toContain("NDA");
    expect(draft.system).toContain("signature block");

    const risk = resolveFeature("risk", { perspective: "party_a" });
    expect(risk.maxTokens).toBeGreaterThan(3000);
    expect(risk.system).toContain("Party A");

    const compliance = resolveFeature("compliance");
    expect(compliance.system).toContain("☐");
    expect(compliance.system).not.toMatch(/✅ Status indicator/);

    const litigation = resolveFeature("litigation");
    expect(litigation.system).toMatch(/NEVER invent/i);
  });
});
