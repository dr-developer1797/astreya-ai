"use client";

import { C } from "@/shared/constants/theme";

export default function Spinner() {
  return (
    <div
      style={{
        width: 13,
        height: 13,
        border: `2px solid ${C.border}`,
        borderTop: `2px solid ${C.red}`,
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
      }}
    />
  );
}
