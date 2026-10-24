"use client";

import { C, F } from "@/shared/constants/theme";
import { LEGAL, PRODUCT_DISCLAIMER } from "@/shared/legal/site";

/**
 * Compact product disclaimer for the app shell.
 * Full Privacy / Terms pages live on astreya.ai — link out only.
 */
export default function ProductDisclaimer({ compact = false }) {
  const linkStyle = {
    color: C.textSec,
    textDecoration: "underline",
    textUnderlineOffset: 2,
    fontSize: compact ? 8 : 9,
  };

  return (
    <div
      role="note"
      aria-label="Legal disclaimer"
      style={{
        marginTop: compact ? 6 : 8,
        padding: compact ? "6px 7px" : "8px 9px",
        background: `${C.amber}0A`,
        border: `1px solid ${C.amber}28`,
        borderRadius: 6,
      }}
    >
      <div
        style={{
          fontSize: 8,
          color: C.amber,
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginBottom: 4,
          fontFamily: F.sans,
        }}
      >
        Not legal advice
      </div>
      <p
        style={{
          margin: 0,
          fontSize: compact ? 8.5 : 9.5,
          color: C.textMut,
          lineHeight: 1.45,
          fontFamily: F.sans,
        }}
      >
        {PRODUCT_DISCLAIMER}
      </p>
      <div style={{ marginTop: 5, display: "flex", gap: 8, flexWrap: "wrap", fontFamily: F.sans }}>
        <a href={LEGAL.terms} target="_blank" rel="noopener noreferrer" style={linkStyle}>
          Terms
        </a>
        <a href={LEGAL.privacy} target="_blank" rel="noopener noreferrer" style={linkStyle}>
          Privacy
        </a>
      </div>
    </div>
  );
}
