const RISK_LEVELS = new Set(["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]);

function asString(value, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function asNumber(value, fallback = 0) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function asStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => asString(item)).filter(Boolean);
}

function excerptInContract(excerpt, contractText) {
  if (!excerpt || !contractText) return false;
  const normalize = (s) => s.toLowerCase().replace(/\s+/g, " ").trim();
  return normalize(contractText).includes(normalize(excerpt));
}

/** Pull the first JSON object out of model output that may include fences or trailing text. */
export function extractJsonObject(raw) {
  if (!raw || typeof raw !== "string") return null;
  const cleaned = raw.replace(/```json|```/gi, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    /* fall through */
  }
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

export function normalizeRiskReport(parsed, contractText = "") {
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Risk analysis returned an unexpected shape.");
  }

  const risks = Array.isArray(parsed.risks)
    ? parsed.risks.map((risk, index) => {
        const excerpt = asString(risk?.clause_excerpt).slice(0, 180);
        const level = asString(risk?.risk_level, "MEDIUM").toUpperCase();
        return {
          id: asString(risk?.id, `R${index + 1}`),
          clause_ref: asString(risk?.clause_ref, `Clause ${index + 1}`),
          clause_excerpt: excerpt,
          excerpt_verified: excerptInContract(excerpt, contractText),
          risk_level: RISK_LEVELS.has(level) ? level : "MEDIUM",
          risk_type: asString(risk?.risk_type, "Unspecified risk"),
          issue: asString(risk?.issue),
          legal_basis: asString(risk?.legal_basis),
          suggested_revision: asString(risk?.suggested_revision),
        };
      })
    : [];

  const score = Math.min(10, Math.max(0, asNumber(parsed.overall_score, 0)));

  return {
    overall_score: score,
    contract_type_detected: asString(parsed.contract_type_detected, "Unknown"),
    summary: asString(parsed.summary, "No summary returned."),
    risks,
    missing_clauses: asStringArray(parsed.missing_clauses),
    positive_clauses: asStringArray(parsed.positive_clauses),
  };
}

export function parseRiskReport(raw, contractText = "") {
  const parsed = extractJsonObject(raw);
  if (!parsed) throw new Error("Risk analysis did not return valid JSON. Please try again.");
  return normalizeRiskReport(parsed, contractText);
}
