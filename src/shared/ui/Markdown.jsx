"use client";

import { C, F } from "@/shared/constants/theme";

function inlineBoldItalic(text, keyPrefix = "") {
  const bold = (s) => {
    const ps = s.split(/(\*\*[^*]+\*\*)/g);
    return ps.map((p, j) =>
      p.startsWith("**") ? (
        <strong key={`${keyPrefix}b${j}`} style={{ color: C.textPri, fontWeight: 600 }}>
          {p.slice(2, -2)}
        </strong>
      ) : (
        p
      ),
    );
  };
  const ps = text.split(/(\*[^*]+\*)/g);
  return ps.map((p, j) =>
    p.startsWith("*") && !p.startsWith("**") ? (
      <em key={`${keyPrefix}i${j}`} style={{ fontStyle: "italic" }}>
        {p.slice(1, -1)}
      </em>
    ) : (
      bold(p)
    ),
  );
}

function renderResearchLine(line, i) {
  if (/^\d{2}\.\ /.test(line)) {
    const m = line.match(/^(\d{2})\.\s(.*)/);
    return (
      <div key={i} style={{ display: "flex", gap: 9, marginBottom: 6 }}>
        <span style={{ color: C.red, fontWeight: 700, fontFamily: "monospace", fontSize: 11, minWidth: 22, flexShrink: 0, marginTop: 2 }}>{m[1]}.</span>
        <span style={{ fontSize: 13, color: C.textPri, lineHeight: 1.7, fontFamily: F.sans, fontWeight: 300 }}>{inlineBoldItalic(m[2], `${i}-`)}</span>
      </div>
    );
  }
  if (/^#{1,6}\s/.test(line)) {
    const m = line.match(/^(#{1,6})\s+(.*)/);
    const top = m[1].length <= 2;
    return (
      <div
        key={i}
        style={{
          fontSize: top ? 14 : 10,
          fontWeight: top ? 600 : 700,
          letterSpacing: top ? "0.01em" : "0.1em",
          textTransform: top ? "none" : "uppercase",
          color: top ? C.textPri : C.textSec,
          marginTop: i > 0 ? 18 : 0,
          marginBottom: 8,
          borderBottom: `1px solid ${C.border}`,
          paddingBottom: 7,
          fontFamily: top ? F.serif : F.sans,
        }}
      >
        {inlineBoldItalic(m[2], `${i}-`)}
      </div>
    );
  }
  if (/^\s*\|.*\|?\s*$/.test(line) && line.includes("|")) {
    const cells = line.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
    if (cells.every((c) => /^:?-{2,}:?$/.test(c))) return null;
    return (
      <div key={i} style={{ display: "flex", gap: 10, padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
        {cells.map((c, j) => (
          <div key={j} style={{ flex: j === 0 ? "0 0 36%" : 1, fontSize: 12, color: j === 0 ? C.textPri : C.textSec, fontFamily: F.sans, fontWeight: j === 0 ? 500 : 300, lineHeight: 1.6 }}>
            {inlineBoldItalic(c, `${i}-${j}-`)}
          </div>
        ))}
      </div>
    );
  }
  if (line.startsWith("**") && line.endsWith("**")) {
    return (
      <div key={i} style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.textSec, marginBottom: 8, marginTop: i > 0 ? 18 : 0, borderBottom: `1px solid ${C.border}`, paddingBottom: 7, fontFamily: F.sans }}>
        {line.slice(2, -2)}
      </div>
    );
  }
  if (line.startsWith("- ")) {
    return (
      <div key={i} style={{ display: "flex", gap: 8, marginBottom: 5 }}>
        <span style={{ color: C.red, fontSize: 11, marginTop: 3, flexShrink: 0 }}>▸</span>
        <span style={{ fontSize: 13, color: C.textPri, lineHeight: 1.7, fontFamily: F.sans, fontWeight: 300 }}>{inlineBoldItalic(line.slice(2), `${i}-`)}</span>
      </div>
    );
  }
  if (line.startsWith("⚠")) {
    return (
      <div key={i} style={{ marginTop: 14, padding: "9px 13px", background: `${C.amber}0E`, border: `1px solid ${C.amber}33`, borderRadius: 6, fontSize: 11, color: C.amber, fontFamily: F.sans, lineHeight: 1.55 }}>
        {line}
      </div>
    );
  }
  if (line.trim() === "") return <div key={i} style={{ height: 5 }} />;
  return (
    <p key={i} style={{ fontSize: 13, color: C.textPri, lineHeight: 1.8, marginBottom: 4, fontFamily: F.sans, fontWeight: 300 }}>
      {inlineBoldItalic(line, `${i}-`)}
    </p>
  );
}

function renderReportLine(line, i, { bulletColor = C.red } = {}) {
  if (line.startsWith("## ")) {
    return (
      <div key={i} style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: C.textSec, marginBottom: 8, marginTop: i > 0 ? 20 : 0, borderBottom: `1px solid ${C.border}`, paddingBottom: 7, fontFamily: F.sans }}>
        {line.slice(3)}
      </div>
    );
  }
  if (line.startsWith("### ")) {
    return (
      <div key={i} style={{ fontSize: 12, fontWeight: 600, color: C.gold, marginBottom: 6, marginTop: 12, fontFamily: F.sans }}>
        {line.slice(4)}
      </div>
    );
  }
  if (line.match(/^[✅☐⚠🔴🟡🟢]/)) {
    return (
      <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, padding: "6px 10px", background: C.bgHover, borderRadius: 5 }}>
        <span style={{ flexShrink: 0, fontSize: 13 }}>{line.charAt(0)}</span>
        <span style={{ fontSize: 12, color: C.textPri, lineHeight: 1.65, fontFamily: F.sans, fontWeight: 300 }}>{line.slice(1).trim()}</span>
      </div>
    );
  }
  if (line.startsWith("- ") || line.startsWith("• ")) {
    return (
      <div key={i} style={{ display: "flex", gap: 8, marginBottom: 5 }}>
        <span style={{ color: bulletColor, fontSize: 11, marginTop: 3, flexShrink: 0 }}>▸</span>
        <span style={{ fontSize: 12.5, color: C.textPri, lineHeight: 1.7, fontFamily: F.sans, fontWeight: 300 }}>{line.replace(/^[-•]\s*/, "")}</span>
      </div>
    );
  }
  if (/^\d+\./.test(line)) {
    return (
      <div key={i} style={{ display: "flex", gap: 8, marginBottom: 5 }}>
        <span style={{ color: bulletColor, fontSize: 10, fontFamily: "monospace", minWidth: 20, marginTop: 3, flexShrink: 0 }}>{line.match(/^\d+/)[0]}.</span>
        <span style={{ fontSize: 12.5, color: C.textPri, lineHeight: 1.7, fontFamily: F.sans, fontWeight: 300 }}>{line.replace(/^\d+\.\s*/, "")}</span>
      </div>
    );
  }
  if (line.startsWith("⚠")) {
    return (
      <div key={i} style={{ marginTop: 16, padding: "9px 13px", background: `${C.amber}0E`, border: `1px solid ${C.amber}33`, borderRadius: 6, fontSize: 11, color: C.amber, fontFamily: F.sans, lineHeight: 1.5 }}>
        {line}
      </div>
    );
  }
  if (line.trim() === "") return <div key={i} style={{ height: 4 }} />;
  return (
    <p key={i} style={{ fontSize: 12.5, color: C.textPri, lineHeight: 1.75, marginBottom: 6, fontFamily: F.sans, fontWeight: 300 }}>
      {line}
    </p>
  );
}

/**
 * @param {"research"|"report"|"compliance"} variant
 */
export default function Markdown({ text, variant = "report" }) {
  if (!text) return null;
  const lines = text.split("\n");
  if (variant === "research") {
    return lines.map((line, i) => renderResearchLine(line, i));
  }
  const opts = variant === "compliance" ? { bulletColor: C.gold } : { bulletColor: C.red };
  return lines.map((line, i) => renderReportLine(line, i, opts));
}
