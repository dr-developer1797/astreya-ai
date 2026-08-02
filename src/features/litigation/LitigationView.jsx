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

export default function LitigationView() {
  const { streaming, text: report, progress, stream, reset } = useLLMStream();
  const { scheduleTimeout } = useTimeoutCleanup();
  const [stage, setStage]       = useState("form");
  const [form, setF]            = useFormState({});
  const [exportModal, setExportModal] = useState(false);
  const scrollRef               = useRef(null);

  useEffect(()=>{
    if(scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  },[report]);

  const COURTS = ["Supreme Court of India","High Court – Bombay","High Court – Delhi","High Court – Madras","High Court – Karnataka","High Court – Calcutta","High Court – Allahabad","High Court – Gujarat","NCLT","NCLAT","Consumer Forum","Other Tribunal"];
  const POSITIONS = ["Plaintiff / Petitioner","Defendant / Respondent","Appellant","Complainant","Accused"];
  const DOMAINS = ["Civil Suit (Money Recovery)","Criminal Matter","Cheque Dishonour (S.138 NI Act)","Corporate / Insolvency","Labour / Employment","Property / Real Estate","Intellectual Property","Family / Matrimonial","Tax Dispute","Consumer Complaint","Constitutional / Writ","Arbitration"];

  const generate = useCallback(async () => {
    if (!form.facts?.trim() || form.facts.trim().length < 40) return;
    reset();
    setStage("generating");
    const sys = `You are a senior Indian litigator with 25 years of courtroom experience. Produce a detailed Litigation Strategy Report using this EXACT structure (use Markdown headings and bullets):

## Matter Overview
## Applicable Statutes & Jurisdiction
## Limitation Period
## Strengths (score X/10)
## Weaknesses & Risks (score X/10)
## Recommended Legal Strategy (numbered steps)
## Key Legal Arguments
## Binding Precedents (cite SCC/AIR with short note)
## Evidence Checklist
## Interim Relief Options
## Estimated Timeline
## Cost-Benefit Assessment

Be specific to Indian law. Cite statutes and Supreme Court precedents. End with: "⚠ Strategy output only — consult a qualified advocate before proceeding."`;

    const usr = `CLIENT POSITION: ${form.position||"Not specified"}
COURT / FORUM: ${form.court||"Not specified"}
DOMAIN: ${form.domain||"Not specified"}
OPPONENT: ${form.opponent||"Not specified"}
BRIEF FACTS:\n${form.facts}
SPECIFIC CONCERNS: ${form.concerns||"None"}
NOTES: ${form.notes||"None"}`;

    try {
      const full = await stream({
        sys,
        messages: [{ role: "user", content: usr }],
        charBudget: 2800,
      });
      if (!full) {
        setStage("form");
        return;
      }
      scheduleTimeout(() => setStage("results"), 350);
    } catch {
      setStage("results");
    }
  }, [form, stream, reset, scheduleTimeout]);

  if(stage==="form") return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <ViewHeader crumbs={[{ label: "Litigation" }, { label: "Strategy Report" }]} />
      <div style={{flex:1,overflowY:"auto",padding:"28px 34px"}}>
        <div style={{maxWidth:680}}>
          <div style={{marginBottom:24}}>
            <div style={{fontFamily:F.serif,fontSize:26,fontWeight:600,color:C.textPri,marginBottom:5}}>Litigation Strategy</div>
            <p style={{fontSize:13,color:C.textSec,fontFamily:F.sans,fontWeight:300}}>Describe your matter. Astreya will generate a comprehensive strategy report — strengths, weaknesses, precedents, evidence checklist, and recommended steps.</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
            {[
              {k:"position",label:"Client's Position",type:"select",opts:POSITIONS},
              {k:"court",label:"Court / Forum",type:"select",opts:COURTS},
              {k:"domain",label:"Legal Domain",type:"select",opts:DOMAINS},
              {k:"opponent",label:"Opposing Party (brief)",type:"text",ph:"e.g. ABC Pvt Ltd — landlord refusing refund"},
            ].map(f=>(
              <div key={f.k}>
                <label style={{display:"block",fontSize:11,color:C.textSec,fontFamily:F.sans,marginBottom:6}}>{f.label}</label>
                <Field field={{ key: f.k, type: f.type, opts: f.opts, ph: f.ph }} value={form[f.k]} onChange={setF} />
              </div>
            ))}
          </div>
          {[
            {k:"facts",label:"Brief Facts of the Matter *",type:"textarea",ph:"Describe what happened — dates, parties, key events, documents involved…",rows:110},
            {k:"concerns",label:"Specific Legal Concerns",type:"textarea",ph:"e.g. Limitation period may be expiring, key witness unavailable, opponent has already filed…",rows:70},
            {k:"notes",label:"Additional Instructions",type:"textarea",ph:"e.g. Prefer arbitration over litigation, budget-conscious strategy needed, settlement preferred…",rows:70},
          ].map(f=>(
            <div key={f.k} style={{marginBottom:14}}>
              <label style={{display:"block",fontSize:11,color:C.textSec,fontFamily:F.sans,marginBottom:6}}>{f.label}</label>
              <Field field={{ key: f.k, type: f.type, ph: f.ph, rows: f.rows }} value={form[f.k]} onChange={setF} />
            </div>
          ))}
          <div style={{padding:"9px 13px",background:C.bgCard,border:`1px solid ${C.border}`,borderLeft:`2px solid ${C.amber}`,borderRadius:"0 6px 6px 0",marginBottom:18}}>
            <p style={{fontSize:10.5,color:C.textMut,lineHeight:1.6,fontFamily:F.sans}}><span style={{color:C.amber,fontWeight:600}}>Note.</span> Strategy reports are AI-generated preliminary analysis. Verify all citations and consult a qualified advocate before filing.</p>
          </div>
          <Btn primary onClick={generate} disabled={!form.facts?.trim()||form.facts.trim().length<40}>
            ⚖ Generate Strategy Report
          </Btn>
        </div>
      </div>
    </div>
  );

  if(stage==="generating") return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <ViewHeader
        crumbs={[{ label: "Litigation", muted: true }, { label: "Generating Strategy…" }]}
        status={
          <>
            <div style={{ width: 13, height: 13, border: `2px solid ${C.border}`, borderTop: `2px solid ${C.red}`, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
            <span style={{ fontSize: 11, color: C.textMut }}>{progress}%</span>
          </>
        }
      />
      <div ref={scrollRef} style={{flex:1,overflowY:"auto",padding:"28px 36px"}}>
        <div style={{maxWidth:680}}>
          <div style={{height:2,background:C.bgHover,borderRadius:2,marginBottom:20}}><div style={{width:`${progress}%`,height:"100%",background:C.red,borderRadius:2,transition:"width 0.2s"}}/></div>
          <div style={{fontFamily:F.sans,fontSize:12.5,color:C.textPri,lineHeight:1.85,fontWeight:300}}>
            {report && <Markdown text={report} variant="report" />}
            {streaming&&<span style={{display:"inline-block",width:2,height:14,background:C.red,marginLeft:1,animation:"blink 1s step-end infinite",verticalAlign:"text-bottom"}}/>}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <ViewHeader
        crumbs={[
          { label: "Litigation", onClick: () => setStage("form") },
          { label: "Strategy Report" },
        ]}
        status={
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 9, color: C.green, letterSpacing: "0.08em" }}>COMPLETE</span>
          </div>
        }
        actions={
          <>
            <Btn compact onClick={() => { setStage("form"); reset(); }}>← New Matter</Btn>
            <Btn compact onClick={() => navigator.clipboard?.writeText(report)}>Copy</Btn>
            <Btn compact onClick={() => setExportModal(true)}>↓ Export Word</Btn>
          </>
        }
      />
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        <div ref={scrollRef} style={{flex:1,overflowY:"auto",padding:"28px 36px"}}>
          <div style={{maxWidth:700,background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:10,padding:"32px 36px"}}>
            {report && <Markdown text={report} variant="report" />}
          </div>
        </div>
        <div className="ast-editor-side ast-panel-r-narrow" style={{width:210,borderLeft:`1px solid ${C.border}`,background:C.bgPanel,padding:"16px 14px",overflowY:"auto"}}>
          <div style={{fontSize:9,color:C.textMut,letterSpacing:"0.13em",textTransform:"uppercase",marginBottom:10}}>Matter Details</div>
          {[["Position",form.position],["Court",form.court],["Domain",form.domain],["Opponent",form.opponent]].map(([k,v])=>v&&(
            <div key={k} style={{marginBottom:10,padding:"8px 10px",background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:6}}>
              <div style={{fontSize:9,color:C.textMut,marginBottom:2}}>{k}</div>
              <div style={{fontSize:11,color:C.textPri,fontFamily:F.sans,lineHeight:1.4}}>{v}</div>
            </div>
          ))}
          <ReminderCard>Verify all citations with SCC Online / Manupatra before filing.</ReminderCard>
        </div>
      </div>
      {exportModal&&<ExportModal defaultName="litigation_strategy_astreya" content={report} title={`Litigation Strategy — ${form.domain||'Matter'}`} onClose={()=>setExportModal(false)}/>}
    </div>
  );
}
