"use client";

import { C, F } from "@/shared/constants/theme";

export default function ReminderCard({ title = "REMINDER", children, accent = C.amber }) {
  return (
    <div style={{ padding: "9px 10px", background: `${accent}0E`, border: `1px solid ${accent}33`, borderRadius: 6 }}>
      <div style={{ fontSize: 9, color: accent, fontWeight: 600, letterSpacing: "0.08em", marginBottom: 3 }}>{title}</div>
      <p style={{ fontSize: 10, color: C.textMut, lineHeight: 1.5, fontFamily: F.sans }}>{children}</p>
    </div>
  );
}
