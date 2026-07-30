"use client";

import { useEffect, useRef, useState } from "react";
import { C, F } from "@/shared/constants/theme";
import { toWordDoc, downloadDoc } from "@/shared/export/word";

export default function ExportModal({ defaultName, content, title, onClose }) {
  const [name, setName]   = useState(defaultName);
  const [done, setDone]   = useState(false);
  const inputRef          = useRef(null);

  useEffect(()=>{ setTimeout(()=>{ inputRef.current?.select(); },50); },[]);

  const handleExport = () => {
    const html = toWordDoc(content, title||name);
    downloadDoc(html, name||defaultName);
    setDone(true);
    setTimeout(onClose, 1200);
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.72)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,animation:"fadeIn 0.18s ease"}}
      onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div style={{background:C.bgPanel,border:`1px solid ${C.borderMid}`,borderRadius:12,padding:"28px 28px 24px",width:420,animation:"fadeUp 0.2s ease",boxShadow:"0 16px 48px rgba(0,0,0,0.6)"}} className="ast-export-modal">
        {/* header */}
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
          <div style={{width:32,height:32,background:C.redFaint,border:`1px solid ${C.redGlow}`,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>📄</div>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:C.textPri,fontFamily:F.sans}}>Export as Word Document</div>
            <div style={{fontSize:10,color:C.textMut,fontFamily:F.sans}}>Saves as .doc — opens in Microsoft Word</div>
          </div>
          <button onClick={onClose} style={{marginLeft:"auto",background:"transparent",border:"none",color:C.textMut,cursor:"pointer",fontSize:18,lineHeight:1,padding:4}}>×</button>
        </div>

        {/* filename input */}
        <div style={{marginBottom:18}}>
          <label style={{display:"block",fontSize:10,color:C.textSec,fontFamily:F.sans,letterSpacing:"0.05em",marginBottom:7}}>FILE NAME</label>
          <div style={{display:"flex",alignItems:"center",background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:7,overflow:"hidden",transition:"border-color 0.15s"}}
            onFocusCapture={e=>e.currentTarget.style.borderColor=C.red}
            onBlurCapture={e=>e.currentTarget.style.borderColor=C.border}>
            <input ref={inputRef} value={name} onChange={e=>setName(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter") handleExport(); if(e.key==="Escape") onClose(); }}
              style={{flex:1,background:"transparent",border:"none",outline:"none",padding:"10px 13px",fontSize:12.5,color:C.textPri,fontFamily:F.sans,fontWeight:300}}/>
            <span style={{padding:"0 12px",fontSize:11,color:C.textMut,borderLeft:`1px solid ${C.border}`,height:"100%",display:"flex",alignItems:"center",fontFamily:F.sans,background:C.bgHover}}>.doc</span>
          </div>
          <div style={{fontSize:9,color:C.textMut,fontFamily:F.sans,marginTop:5}}>You can rename this file any time after downloading.</div>
        </div>

        {/* format info */}
        <div style={{display:"flex",gap:8,marginBottom:20}}>
          {[["📝","Word (.doc)","Recommended"],["🔤","Formatted headings","Preserved"],["⚖","Astreya footer","Included"]].map(([ic,l,sub])=>(
            <div key={l} style={{flex:1,padding:"8px 10px",background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:6,textAlign:"center"}}>
              <div style={{fontSize:14,marginBottom:3}}>{ic}</div>
              <div style={{fontSize:9.5,color:C.textPri,fontFamily:F.sans,fontWeight:500}}>{l}</div>
              <div style={{fontSize:8.5,color:C.textMut,fontFamily:F.sans,marginTop:1}}>{sub}</div>
            </div>
          ))}
        </div>

        {/* actions */}
        <div style={{display:"flex",gap:8}}>
          <button onClick={onClose} style={{flex:1,padding:"10px",background:"transparent",border:`1px solid ${C.border}`,borderRadius:7,color:C.textSec,fontSize:12,cursor:"pointer",fontFamily:F.sans}}>Cancel</button>
          <button onClick={handleExport}
            style={{flex:2,padding:"10px",background:done?C.green:C.red,border:"none",borderRadius:7,color:"#fff",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:F.sans,transition:"background 0.3s",letterSpacing:"0.03em"}}
            onMouseEnter={e=>{ if(!done)e.currentTarget.style.background="#B51D30"; }}
            onMouseLeave={e=>{ if(!done)e.currentTarget.style.background=C.red; }}>
            {done?"✓ Downloaded!":"↓ Download Word Doc"}
          </button>
        </div>
      </div>
    </div>
  );
}
