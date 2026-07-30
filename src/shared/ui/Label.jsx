"use client";

import { C } from "@/shared/constants/theme";

export default function Label({ children, mt = 0 }) {
  return (
    <div
      style={{
        fontSize: 9,
        color: C.textMut,
        letterSpacing: "0.13em",
        textTransform: "uppercase",
        marginBottom: 7,
        marginTop: mt,
      }}
    >
      {children}
    </div>
  );
}
