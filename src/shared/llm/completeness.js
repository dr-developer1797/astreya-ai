const SIGNATURE_RE =
  /\b(in witness whereof|signed (and|&) delivered|for and on behalf of|signature\s*(block|of)|authorised?\s+signator|witnesses?:)\b/i;

const MID_CLAUSE_RE = /^\s*\d+(\.\d+)*\.?\s+\S.{0,120}$/m;

/**
 * Heuristic: a draft that never reaches a signature / execution block is incomplete.
 * Used to avoid marking truncated model output as DRAFT READY.
 */
export function isDraftIncomplete(text) {
  if (!text || typeof text !== "string") return true;
  const trimmed = text.trim();
  if (!trimmed) return true;
  // Signature/execution markers win even on shorter documents.
  if (SIGNATURE_RE.test(trimmed)) return false;
  if (trimmed.length < 400) return true;
  // Ends on a bare heading or mid-sentence without closing punctuation.
  const lastLine = trimmed.split(/\n/).filter(Boolean).at(-1) || "";
  if (/^\d+(\.\d+)*\.?\s+\S+$/.test(lastLine.trim())) return true;
  if (MID_CLAUSE_RE.test(lastLine) && !/[.!?]"?$/.test(lastLine.trim())) return true;
  return true;
}

export function isReportIncomplete(text, { minChars = 600 } = {}) {
  if (!text || typeof text !== "string") return true;
  const trimmed = text.trim();
  if (!trimmed) return true;
  const hasDisclaimer = /⚠/.test(trimmed);
  if (hasDisclaimer) return false;
  if (trimmed.length < minChars) return true;
  return true;
}
