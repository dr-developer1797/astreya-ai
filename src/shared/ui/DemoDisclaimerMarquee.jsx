"use client";

import { C, F } from "@/shared/constants/theme";

const DEMO_DISCLAIMER =
  "Demo build — no login required. Astreya is in alpha; some features may be limited or incomplete. Work is not persisted across page refresh.";

export default function DemoDisclaimerMarquee() {
  const item = (
    <span style={{ display:"inline-flex", alignItems:"center", gap:"2.5em", paddingRight:"2.5em" }}>
      <span style={{ fontSize:10, color:C.amber, fontFamily:F.sans, letterSpacing:"0.06em", fontWeight:500 }}>
        {DEMO_DISCLAIMER}
      </span>
      <span style={{ color:`${C.amber}55`, fontSize:8 }}>◆</span>
    </span>
  );
  return (
    <div
      role="status"
      aria-label={DEMO_DISCLAIMER}
      style={{
        flexShrink:0,
        background:`linear-gradient(90deg, ${C.amber}12, ${C.amber}08, ${C.amber}12)`,
        borderBottom:`1px solid ${C.amber}30`,
        overflow:"hidden",
        height:28,
      }}
      className="ast-marquee-bar"
    >
      <div className="demo-marquee-track ast-demo-marquee-track" style={{ display:"flex", width:"max-content", alignItems:"center", height:"100%" }}>
        {item}{item}
      </div>
    </div>
  );
}
