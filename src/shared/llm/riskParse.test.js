import { describe, expect, it } from "vitest";
import { extractJsonObject, parseRiskReport } from "./riskParse";

describe("riskParse", () => {
  it("extracts JSON from fenced or noisy model output", () => {
    const raw = 'Here you go:\n```json\n{"overall_score":7,"summary":"High liability"}\n```\nThanks';
    expect(extractJsonObject(raw)).toEqual({ overall_score: 7, summary: "High liability" });
  });

  it("normalizes scores and verifies excerpts against the contract", () => {
    const contract = "The Vendor shall have unlimited liability for any losses.";
    const report = parseRiskReport(
      JSON.stringify({
        overall_score: "8",
        contract_type_detected: "MSA",
        summary: "Liability is broad.",
        risks: [
          {
            id: "R1",
            clause_ref: "Clause 4",
            clause_excerpt: "unlimited liability for any losses",
            risk_level: "CRITICAL",
            risk_type: "Unlimited Liability",
            issue: "Broad liability.",
            legal_basis: "Indian Contract Act",
            suggested_revision: "Cap liability.",
          },
          {
            id: "R2",
            clause_ref: "Clause 9",
            clause_excerpt: "made up excerpt that is not present",
            risk_level: "HIGH",
            risk_type: "Invented",
            issue: "Missing.",
            legal_basis: "N/A",
            suggested_revision: "N/A",
          },
        ],
        missing_clauses: ["Indemnity"],
        positive_clauses: ["Governing law"],
      }),
      contract,
    );

    expect(report.overall_score).toBe(8);
    expect(report.risks[0].excerpt_verified).toBe(true);
    expect(report.risks[1].excerpt_verified).toBe(false);
  });

  it("throws on unparseable output", () => {
    expect(() => parseRiskReport("not json at all")).toThrow(/valid JSON/i);
  });
});
