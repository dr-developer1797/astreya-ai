"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { C, F } from "@/shared/constants/theme";
import ExportModal from "@/shared/modals/ExportModal";
import { streamChatCompletion } from "@/shared/llm/stream";
import { useFormState } from "@/shared/hooks/useFormState";

export default function ComplianceView() {
  const [stage, setStage]       = useState("form");
  const [form, setF, setForm]   = useFormState({sectors:[]});
  const [report, setReport]     = useState("");
  const [streaming, setStr]     = useState(false);
  const [progress, setProg]     = useState(0);
  const [exportModal, setExportModal] = useState(false);
  const scrollRef               = useRef(null);

  useEffect(()=>{ if(scrollRef.current) scrollRef.current.scrollTop=scrollRef.current.scrollHeight; },[report]);

  const STATES = ["Maharashtra","Karnataka","Delhi","Tamil Nadu","Telangana","Gujarat","West Bengal","Rajasthan","Uttar Pradesh","Punjab","Haryana","Kerala","Andhra Pradesh","Madhya Pradesh"];
  const ENTITY_TYPES = ["Private Limited Company","Public Limited Company","LLP","Sole Proprietorship","Partnership Firm","Startup (DPIIT Recognised)","NGO / Section 8 Company","Foreign Company Branch","OPC (One Person Company)"];
  const SECTORS_LIST = ["Technology / Software","Manufacturing","BFSI (Banking / Finance / Insurance)","Healthcare / Pharma","E-commerce / Retail","Real Estate","Food & Beverage","Education","Media & Entertainment","Logistics / Transport","Energy / Power","Other"];
  const EMP_RANGES = ["0–9 (Micro)","10–49 (Small)","50–99","100–249","250–499","500+"];

  const toggleSector=s=>setForm(p=>({...p,sectors:p.sectors.includes(s)?p.sectors.filter(x=>x!==s):[...p.sectors,s]}));

  const generate = useCallback(async ()=>{
    if(!form.state||!form.entity_type)return;
    setStage("generating");setReport("");setProg(0);setStr(true);

    const sys=`You are a senior Indian compliance lawyer and CA with expertise in all central and state regulations. Generate a comprehensive, actionable Compliance Checklist using EXACT Markdown structure:

## Entity & Registration Compliance
## Labour & Employment Compliance
## Tax Compliance (Direct & Indirect)
## Sector-Specific Regulatory Compliance
## Data Protection & IT Compliance
## Corporate Governance & MCA Filings
## Environmental & Other Statutory Requirements
## Upcoming Deadlines & Critical Alerts
## Recommended Actions (Priority Order)

For each item include: ✅ Status indicator, Act/Rule reference, authority name, deadline or frequency, and penalty for non-compliance.
Be state-specific. Include recent 2024–2026 regulatory changes. End with: "⚠ Checklist is AI-generated. Consult a CA/CS/Advocate for final compliance advice."`;

    const usr=`Entity Type: ${form.entity_type}
State: ${form.state}
Sectors: ${form.sectors.join(", ")||"General"}
Employees: ${form.employees||"Not specified"}
Annual Turnover: ${form.turnover||"Not specified"}
Startup Status: ${form.is_startup?"DPIIT Recognised Startup":"No"}
Has Foreign Investment: ${form.has_fdi||"No"}
Special Notes: ${form.notes||"None"}`;

    try{
      let chars = 0;
      await streamChatCompletion({
        sys,
        messages: [{ role: "user", content: usr }],
        onToken: (text, chunk) => {
          chars += chunk.length;
          setReport(text);
          setProg(Math.min(99, Math.round((chars / 3000) * 100)));
        },
      });
      setProg(100);setTimeout(()=>{setStage("results");setStr(false);},350);
    }catch(err){setReport(`Error: ${err.message}`);setStage("results");setStr(false);}
  },[form]);

  const renderMd=(text)=>{
    if(!text)return null;
    return text.split("\n").map((line,i)=>{
      if(line.startsWith("## "))return <div key={i} style={{fontSize:11,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:C.textSec,marginBottom:8,marginTop:i>0?20:0,borderBottom:`1px solid ${C.border}`,paddingBottom:7,fontFamily:F.sans}}>{line.slice(3)}</div>;
      if(line.startsWith("### "))return <div key={i} style={{fontSize:12,fontWeight:600,color:C.gold,marginBottom:6,marginTop:10,fontFamily:F.sans}}>{line.slice(4)}</div>;
      if(line.match(/^[✅☐⚠🔴🟡🟢]/))return <div key={i} style={{display:"flex",gap:8,marginBottom:6,padding:"6px 10px",background:C.bgHover,borderRadius:5}}><span style={{flexShrink:0,fontSize:13}}>{line.charAt(0)}</span><span style={{fontSize:12,color:C.textPri,lineHeight:1.65,fontFamily:F.sans,fontWeight:300}}>{line.slice(1).trim()}</span></div>;
      if(line.startsWith("- ")||line.startsWith("• "))return <div key={i} style={{display:"flex",gap:8,marginBottom:5}}><span style={{color:C.gold,fontSize:11,marginTop:3,flexShrink:0}}>▸</span><span style={{fontSize:12.5,color:C.textPri,lineHeight:1.7,fontFamily:F.sans,fontWeight:300}}>{line.replace(/^[-•]\s*/,"")}</span></div>;
      if(/^\d+\./.test(line))return <div key={i} style={{display:"flex",gap:8,marginBottom:5}}><span style={{color:C.red,fontSize:10,fontFamily:"monospace",minWidth:20,marginTop:3,flexShrink:0}}>{line.match(/^\d+/)[0]}.</span><span style={{fontSize:12.5,color:C.textPri,lineHeight:1.7,fontFamily:F.sans,fontWeight:300}}>{line.replace(/^\d+\.\s*/,"")}</span></div>;
      if(line.startsWith("⚠"))return <div key={i} style={{marginTop:16,padding:"9px 13px",background:`${C.amber}0E`,border:`1px solid ${C.amber}33`,borderRadius:6,fontSize:11,color:C.amber,fontFamily:F.sans,lineHeight:1.5}}>{line}</div>;
      if(line.trim()==="")return <div key={i} style={{height:4}}/>;
      return <p key={i} style={{fontSize:12.5,color:C.textPri,lineHeight:1.75,marginBottom:5,fontFamily:F.sans,fontWeight:300}}>{line}</p>;
    });
  };

  const canGenerate = form.state&&form.entity_type;

  if(stage==="form")return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{height:52,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 22px",background:C.bgPanel,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8,fontSize:12}}><span style={{color:C.textSec}}>Compliance</span><span style={{color:C.textMut}}>›</span><span style={{color:C.textPri}}>Generate Checklist</span></div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"28px 34px"}}>
        <div style={{maxWidth:700}}>
          <div style={{marginBottom:24}}>
            <div style={{fontFamily:F.serif,fontSize:26,fontWeight:600,color:C.textPri,marginBottom:5}}>Compliance Checklist</div>
            <p style={{fontSize:13,color:C.textSec,fontFamily:F.sans,fontWeight:300}}>Tell Astreya about your entity. You&apos;ll get a state-specific, sector-aware compliance checklist covering registrations, filings, labour law, tax, and more.</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
            {[
              {k:"entity_type",label:"Entity Type *",type:"select",opts:ENTITY_TYPES},
              {k:"state",label:"State of Operations *",type:"select",opts:STATES},
              {k:"employees",label:"Employee Headcount",type:"select",opts:EMP_RANGES},
              {k:"turnover",label:"Approx. Annual Turnover",type:"text",ph:"e.g. ₹2 Crore"},
            ].map(f=>(
              <div key={f.k}>
                <label style={{display:"block",fontSize:11,color:C.textSec,fontFamily:F.sans,marginBottom:6}}>{f.label}</label>
                {f.type==="select"
                  ?<select value={form[f.k]||""} onChange={e=>setF(f.k,e.target.value)} style={{width:"100%",background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:7,padding:"9px 12px",color:form[f.k]?C.textPri:C.textMut,fontSize:12.5,fontFamily:F.sans,outline:"none",cursor:"pointer",appearance:"none"}}><option value="">Select…</option>{f.opts.map(o=><option key={o}>{o}</option>)}</select>
                  :<input value={form[f.k]||""} onChange={e=>setF(f.k,e.target.value)} placeholder={f.ph} style={{width:"100%",background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:7,padding:"9px 12px",color:C.textPri,fontSize:12.5,fontFamily:F.sans,outline:"none"}} onFocus={e=>e.target.style.borderColor=C.borderMid} onBlur={e=>e.target.style.borderColor=C.border}/>
                }
              </div>
            ))}
          </div>

          <div style={{marginBottom:16}}>
            <label style={{display:"block",fontSize:11,color:C.textSec,fontFamily:F.sans,marginBottom:8}}>Business Sectors (select all that apply)</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
              {SECTORS_LIST.map(s=>{
                const on=form.sectors?.includes(s);
                return(<span key={s} onClick={()=>toggleSector(s)}
                  style={{fontSize:11,color:on?C.red:C.textSec,background:on?C.redFaint:"transparent",border:`1px solid ${on?C.red:C.border}`,borderRadius:5,padding:"5px 11px",cursor:"pointer",fontFamily:F.sans,transition:"all 0.14s"}}>{s}</span>);
              })}
            </div>
          </div>

          <div style={{display:"flex",gap:14,marginBottom:16}}>
            {[["is_startup","DPIIT Recognised Startup"],["has_fdi","Has Foreign Investment (FDI)"]].map(([k,l])=>(
              <div key={k} onClick={()=>setF(k,!form[k])} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",background:form[k]?C.redFaint:C.bgCard,border:`1px solid ${form[k]?C.red:C.border}`,borderRadius:7,cursor:"pointer",transition:"all 0.14s"}}>
                <div style={{width:14,height:14,borderRadius:3,border:`1.5px solid ${form[k]?C.red:C.border}`,background:form[k]?C.red:"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {form[k]&&<svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><polyline points="2 6 5 9 10 3"/></svg>}
                </div>
                <span style={{fontSize:11,color:form[k]?C.red:C.textSec,fontFamily:F.sans}}>{l}</span>
              </div>
            ))}
          </div>

          <div style={{marginBottom:16}}>
            <label style={{display:"block",fontSize:11,color:C.textSec,fontFamily:F.sans,marginBottom:6}}>Additional Notes</label>
            <textarea value={form.notes||""} onChange={e=>setF("notes",e.target.value)} placeholder="e.g. Recently crossed ₹5Cr turnover, planning to hire contract workers, considering IPO in 2027…" style={{width:"100%",background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:7,padding:"9px 12px",color:C.textPri,fontSize:12.5,fontFamily:F.sans,outline:"none",resize:"vertical",minHeight:72,lineHeight:1.65,fontWeight:300}} onFocus={e=>e.target.style.borderColor=C.borderMid} onBlur={e=>e.target.style.borderColor=C.border}/>
          </div>
          <button onClick={generate} disabled={!canGenerate}
            style={{padding:"11px 26px",background:canGenerate?C.red:"#2A1A1E",border:"none",borderRadius:7,color:canGenerate?"#fff":C.textMut,fontSize:13,fontWeight:500,cursor:canGenerate?"pointer":"not-allowed",fontFamily:F.sans,letterSpacing:"0.04em"}}
            onMouseEnter={e=>{if(canGenerate)e.currentTarget.style.background="#B51D30";}} onMouseLeave={e=>{if(canGenerate)e.currentTarget.style.background=C.red;}}>
            ✦ Generate Compliance Checklist
          </button>
        </div>
      </div>
    </div>
  );

  if(stage==="generating")return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{height:52,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:8,padding:"0 22px",background:C.bgPanel,flexShrink:0,fontSize:12}}>
        <span style={{color:C.textSec}}>Compliance</span><span style={{color:C.textMut}}>›</span><span style={{color:C.textPri}}>Building Checklist…</span>
        <span style={{color:C.textMut,margin:"0 4px"}}>·</span>
        <div style={{width:13,height:13,border:`2px solid ${C.border}`,borderTop:`2px solid ${C.red}`,borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>
        <span style={{fontSize:11,color:C.textMut}}>{progress}%</span>
      </div>
      <div ref={scrollRef} style={{flex:1,overflowY:"auto",padding:"28px 36px"}}>
        <div style={{maxWidth:680}}>
          <div style={{height:2,background:C.bgHover,borderRadius:2,marginBottom:20}}><div style={{width:`${progress}%`,height:"100%",background:C.green,borderRadius:2,transition:"width 0.2s"}}/></div>
          <div style={{fontFamily:F.sans,fontSize:12.5,color:C.textPri,lineHeight:1.85,fontWeight:300}}>
            {renderMd(report)}
            {streaming&&<span style={{display:"inline-block",width:2,height:14,background:C.green,marginLeft:1,animation:"blink 1s step-end infinite",verticalAlign:"text-bottom"}}/>}
          </div>
        </div>
      </div>
    </div>
  );

  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{height:52,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",background:C.bgPanel,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8,fontSize:12}}>
          <span onClick={()=>setStage("form")} style={{color:C.textSec,cursor:"pointer"}} onMouseEnter={e=>e.target.style.color=C.textPri} onMouseLeave={e=>e.target.style.color=C.textSec}>Compliance</span>
          <span style={{color:C.textMut}}>›</span><span style={{color:C.textPri}}>{form.entity_type} · {form.state}</span>
          <span style={{color:C.textMut,margin:"0 4px"}}>·</span>
          <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:6,height:6,borderRadius:"50%",background:C.green,animation:"pulse 2s infinite"}}/><span style={{fontSize:9,color:C.green,letterSpacing:"0.08em"}}>COMPLETE</span></div>
        </div>
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>{setStage("form");setReport("");}} style={{padding:"5px 12px",background:"transparent",border:`1px solid ${C.border}`,borderRadius:5,color:C.textSec,fontSize:11,cursor:"pointer",fontFamily:F.sans}}>← New</button>
          <button onClick={()=>navigator.clipboard?.writeText(report)} style={{padding:"5px 12px",background:"transparent",border:`1px solid ${C.border}`,borderRadius:5,color:C.textSec,fontSize:11,cursor:"pointer",fontFamily:F.sans}}>Copy</button>
          <button onClick={()=>setExportModal(true)} style={{padding:"5px 12px",background:"transparent",border:`1px solid ${C.border}`,borderRadius:5,color:C.textSec,fontSize:11,cursor:"pointer",fontFamily:F.sans}}>↓ Export Word</button>
        </div>
      </div>
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        <div ref={scrollRef} style={{flex:1,overflowY:"auto",padding:"28px 36px"}}>
          <div style={{maxWidth:700,background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:10,padding:"32px 36px"}}>
            {renderMd(report)}
          </div>
        </div>
        <div className="ast-editor-side ast-panel-r-narrow" style={{width:210,borderLeft:`1px solid ${C.border}`,background:C.bgPanel,padding:"16px 14px",overflowY:"auto"}}>
          <div style={{fontSize:9,color:C.textMut,letterSpacing:"0.13em",textTransform:"uppercase",marginBottom:10}}>Entity Profile</div>
          {[["Entity",form.entity_type],["State",form.state],["Employees",form.employees],["Turnover",form.turnover]].map(([k,v])=>v&&(
            <div key={k} style={{marginBottom:9,padding:"8px 10px",background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:6}}>
              <div style={{fontSize:9,color:C.textMut,marginBottom:2}}>{k}</div>
              <div style={{fontSize:11,color:C.textPri,fontFamily:F.sans,lineHeight:1.4}}>{v}</div>
            </div>
          ))}
          {form.sectors?.length>0&&(
            <div style={{marginTop:6}}>
              <div style={{fontSize:9,color:C.textMut,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:7}}>Sectors</div>
              {form.sectors.map(s=><div key={s} style={{fontSize:10,color:C.textSec,background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:4,padding:"3px 8px",marginBottom:4,fontFamily:F.sans}}>{s}</div>)}
            </div>
          )}
          <div style={{marginTop:12,padding:"9px 10px",background:`${C.amber}0E`,border:`1px solid ${C.amber}33`,borderRadius:6}}>
            <div style={{fontSize:9,color:C.amber,fontWeight:600,letterSpacing:"0.08em",marginBottom:3}}>REMINDER</div>
            <p style={{fontSize:10,color:C.textMut,lineHeight:1.5}}>Consult a CA/CS/Advocate for final compliance sign-off.</p>
          </div>
        </div>
      </div>
      {exportModal&&<ExportModal defaultName="compliance_checklist_astreya" content={report} title={`Compliance Checklist — ${form.entity_type||'Entity'} · ${form.state||'India'}`} onClose={()=>setExportModal(false)}/>}
    </div>
  );
}
