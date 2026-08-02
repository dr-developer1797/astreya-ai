"use client";

import { C, F } from "@/shared/constants/theme";

const inputStyle = {
  width: "100%",
  background: C.bgCard,
  border: `1px solid ${C.border}`,
  borderRadius: 7,
  padding: "9px 12px",
  color: C.textPri,
  fontSize: 12.5,
  fontFamily: F.sans,
  outline: "none",
};

export default function Field({ field, value, onChange }) {
  const filled = Boolean(value);
  const onFocus = (e) => { e.target.style.borderColor = C.borderMid; };
  const onBlur = (e) => { e.target.style.borderColor = C.border; };

  if (field.type === "select") {
    return (
      <select
        value={value || ""}
        onChange={(e) => onChange(field.key, e.target.value)}
        style={{ ...inputStyle, color: filled ? C.textPri : C.textMut, cursor: "pointer", appearance: "none" }}
      >
        <option value="">Select…</option>
        {field.opts.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    );
  }

  if (field.type === "textarea") {
    return (
      <textarea
        value={value || ""}
        onChange={(e) => onChange(field.key, e.target.value)}
        placeholder={field.ph}
        style={{
          ...inputStyle,
          resize: "vertical",
          minHeight: field.rows || 76,
          lineHeight: 1.6,
          fontWeight: 300,
        }}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    );
  }

  return (
    <input
      value={value || ""}
      onChange={(e) => onChange(field.key, e.target.value)}
      placeholder={field.ph}
      style={inputStyle}
      onFocus={onFocus}
      onBlur={onBlur}
    />
  );
}
