"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { C, F } from "@/shared/constants/theme";
import Btn from "@/shared/ui/Btn";
import Field from "@/shared/ui/Field";
import Markdown from "@/shared/ui/Markdown";
import ReminderCard from "@/shared/ui/ReminderCard";
import ViewHeader from "@/shared/ui/ViewHeader";
import ExportModal from "@/shared/modals/ExportModal";
import { useLLMStream } from "@/shared/hooks/useLLMStream";
import { useFormState } from "@/shared/hooks/useFormState";
import { useTimeoutCleanup } from "@/shared/hooks/useTimeoutCleanup";

export default function ComplianceView() {
  const { streaming, text: report, progress, stream, reset } = useLLMStream();
  const { scheduleTimeout } = useTimeoutCleanup();
  const [stage, setStage]       = useState("form");
  const [form, setF, setForm]   = useFormState({sectors:[]});
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
    reset();
    setStage("generating");

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

    try {
      const full = await stream({
        sys,
        messages: [{ role: "user", content: usr }],
        charBudget: 3000,
      });
      if (!full) {
        setStage("form");
        return;
      }
      scheduleTimeout(() => setStage("results"), 350);
    } catch {
      setStage("results");
    }
  },[form, stream, reset, scheduleTimeout]);

  const canGenerate = form.state&&form.entity_type;

  if(stage==="form")return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <ViewHeader crumbs={[{ label: "Compliance" }, { label: "Generate Checklist" }]} />
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
                <Field field={{ key: f.k, type: f.type, opts: f.opts, ph: f.ph }} value={form[f.k]} onChange={setF} />
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
            <Field field={{ key: "notes", type: "textarea", ph: "e.g. Recently crossed ₹5Cr turnover, planning to hire contract workers, considering IPO in 2027…", rows: 72 }} value={form.notes} onChange={setF} />
          </div>
          <Btn primary onClick={generate} disabled={!canGenerate}>
            ✦ Generate Compliance Checklist
          </Btn>
        </div>
      </div>
    </div>
  );

  if(stage==="generating")return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <ViewHeader
        crumbs={[{ label: "Compliance", muted: true }, { label: "Building Checklist…" }]}
        status={
          <>
            <div style={{ width: 13, height: 13, border: `2px solid ${C.border}`, borderTop: `2px solid ${C.red}`, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
            <span style={{ fontSize: 11, color: C.textMut }}>{progress}%</span>
          </>
        }
      />
      <div ref={scrollRef} style={{flex:1,overflowY:"auto",padding:"28px 36px"}}>
        <div style={{maxWidth:680}}>
          <div style={{height:2,background:C.bgHover,borderRadius:2,marginBottom:20}}><div style={{width:`${progress}%`,height:"100%",background:C.green,borderRadius:2,transition:"width 0.2s"}}/></div>
          <div style={{fontFamily:F.sans,fontSize:12.5,color:C.textPri,lineHeight:1.85,fontWeight:300}}>
            {report && <Markdown text={report} variant="compliance" />}
            {streaming&&<span style={{display:"inline-block",width:2,height:14,background:C.green,marginLeft:1,animation:"blink 1s step-end infinite",verticalAlign:"text-bottom"}}/>}
          </div>
        </div>
      </div>
    </div>
  );

  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <ViewHeader
        crumbs={[
          { label: "Compliance", onClick: () => setStage("form") },
          { label: `${form.entity_type} · ${form.state}` },
        ]}
        status={
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 9, color: C.green, letterSpacing: "0.08em" }}>COMPLETE</span>
          </div>
        }
        actions={
          <>
            <Btn compact onClick={() => { setStage("form"); reset(); }}>← New</Btn>
            <Btn compact onClick={() => navigator.clipboard?.writeText(report)}>Copy</Btn>
            <Btn compact onClick={() => setExportModal(true)}>↓ Export Word</Btn>
          </>
        }
      />
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        <div ref={scrollRef} style={{flex:1,overflowY:"auto",padding:"28px 36px"}}>
          <div style={{maxWidth:700,background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:10,padding:"32px 36px"}}>
            {report && <Markdown text={report} variant="compliance" />}
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
          <ReminderCard>Consult a CA/CS/Advocate for final compliance sign-off.</ReminderCard>
        </div>
      </div>
      {exportModal&&<ExportModal defaultName="compliance_checklist_astreya" content={report} title={`Compliance Checklist — ${form.entity_type||'Entity'} · ${form.state||'India'}`} onClose={()=>setExportModal(false)}/>}
    </div>
  );
}
