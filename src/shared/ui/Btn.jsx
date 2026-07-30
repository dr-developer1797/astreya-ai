"use client";

import { C, F } from "@/shared/constants/theme";
export default function Btn({ children, onClick, primary, style: sx={}, className="" }) {
  const base = {display:"flex",alignItems:"center",gap:5,padding:"6px 13px",borderRadius:5,fontSize:11,cursor:"pointer",fontFamily:F.sans,letterSpacing:"0.04em",transition:"all 0.15s",border:`1px solid ${primary?C.red:C.border}`,background:primary?C.red:"transparent",color:primary?"#fff":C.textSec,...sx};
  return (
    <button className={className} style={base} onClick={onClick}
      onMouseEnter={e=>{e.currentTarget.style.background=primary?"#B51D30":C.bgHover; if(!primary)e.currentTarget.style.color=C.textPri;}}
      onMouseLeave={e=>{e.currentTarget.style.background=primary?C.red:"transparent"; if(!primary)e.currentTarget.style.color=C.textSec;}}
    >{children}</button>
  );
}
