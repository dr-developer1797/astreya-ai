"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { C, F } from "@/shared/constants/theme";
import ExportModal from "@/shared/modals/ExportModal";
import { streamChatCompletion } from "@/shared/llm/stream";
import { useFormState } from "@/shared/hooks/useFormState";

export default function LitigationView() {
  const [stage, setStage]       = useState("form");
  const [form, setF]            = useFormState({});
  const [report, setReport]     = useState("");
  const [streaming, setStr]     = useState(false);
  const [progress, setProg]     = useState(0);
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
    setStage("generating"); setReport(""); setProg(0); setStr(true);
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
      let chars = 0;
      await streamChatCompletion({
        sys,
        messages: [{ role: "user", content: usr }],
        onToken: (text, chunk) => {
          chars += chunk.length;
          setReport(text);
          setProg(Math.min(99, Math.round((chars / 2800) * 100)));
        },
      });
      setProg(100); setTimeout(()=>{setStage("results");setStr(false);},350);
    } catch(err){setReport(`Error: ${err.message}`);setStage("results");setStr(false);}
  },[form]);

  const renderMd = (text) => {
    if(!text) return null;
    return text.split("\n").map((line,i)=>{
      if(line.startsWith("## ")) return <div key={i} style={{fontSize:11,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:C.textSec,marginBottom:8,marginTop:i>0?20:0,borderBottom:`1px solid ${C.border}`,paddingBottom:7,fontFamily:F.sans}}>{line.slice(3)}</div>;
      if(line.startsWith("### ")) return <div key={i} style={{fontSize:12,fontWeight:600,color:C.gold,marginBottom:6,marginTop:12,fontFamily:F.sans}}>{line.slice(4)}</div>;
      if(line.startsWith("- ")||line.startsWith("• ")) return <div key={i} style={{display:"flex",gap:8,marginBottom:5}}><span style={{color:C.red,fontSize:11,marginTop:3,flexShrink:0}}>▸</span><span style={{fontSize:12.5,color:C.textPri,lineHeight:1.7,fontFamily:F.sans,fontWeight:300}}>{line.replace(/^[-•]\s*/,"")}</span></div>;
      if(/^\d+\./.test(line)) return <div key={i} style={{display:"flex",gap:8,marginBottom:5}}><span style={{color:C.red,fontSize:10,fontFamily:"monospace",minWidth:20,marginTop:3,flexShrink:0}}>{line.match(/^\d+/)[0]}.</span><span style={{fontSize:12.5,color:C.textPri,lineHeight:1.7,fontFamily:F.sans,fontWeight:300}}>{line.replace(/^\d+\.\s*/,"")}</span></div>;
      if(line.startsWith("⚠")) return <div key={i} style={{marginTop:16,padding:"9px 13px",background:`${C.amber}0E`,border:`1px solid ${C.amber}33`,borderRadius:6,fontSize:11,color:C.amber,fontFamily:F.sans,lineHeight:1.5}}>{line}</div>;
      if(line.trim()==="") return <div key={i} style={{height:4}}/>;
      return <p key={i} style={{fontSize:12.5,color:C.textPri,lineHeight:1.75,marginBottom:6,fontFamily:F.sans,fontWeight:300}}>{line}</p>;
    });
  };

  if(stage==="form") return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{height:52,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 22px",background:C.bgPanel,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8,fontSize:12}}><span style={{color:C.textSec}}>Litigation</span><span style={{color:C.textMut}}>›</span><span style={{color:C.textPri}}>Strategy Report</span></div>
      </div>
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
                {f.type==="select"
                  ? <select value={form[f.k]||""} onChange={e=>setF(f.k,e.target.value)} style={{width:"100%",background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:7,padding:"9px 12px",color:form[f.k]?C.textPri:C.textMut,fontSize:12.5,fontFamily:F.sans,outline:"none",cursor:"pointer",appearance:"none"}}><option value="">Select…</option>{f.opts.map(o=><option key={o}>{o}</option>)}</select>
                  : <input value={form[f.k]||""} onChange={e=>setF(f.k,e.target.value)} placeholder={f.ph} style={{width:"100%",background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:7,padding:"9px 12px",color:C.textPri,fontSize:12.5,fontFamily:F.sans,outline:"none"}} onFocus={e=>e.target.style.borderColor=C.borderMid} onBlur={e=>e.target.style.borderColor=C.border}/>
                }
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
              <textarea value={form[f.k]||""} onChange={e=>setF(f.k,e.target.value)} placeholder={f.ph} style={{width:"100%",background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:7,padding:"9px 12px",color:C.textPri,fontSize:12.5,fontFamily:F.sans,outline:"none",resize:"vertical",minHeight:f.rows,lineHeight:1.65,fontWeight:300}} onFocus={e=>e.target.style.borderColor=C.borderMid} onBlur={e=>e.target.style.borderColor=C.border}/>
            </div>
          ))}
          <div style={{padding:"9px 13px",background:C.bgCard,border:`1px solid ${C.border}`,borderLeft:`2px solid ${C.amber}`,borderRadius:"0 6px 6px 0",marginBottom:18}}>
            <p style={{fontSize:10.5,color:C.textMut,lineHeight:1.6,fontFamily:F.sans}}><span style={{color:C.amber,fontWeight:600}}>Note.</span> Strategy reports are AI-generated preliminary analysis. Verify all citations and consult a qualified advocate before filing.</p>
          </div>
          <button onClick={generate} disabled={!form.facts?.trim()||form.facts.trim().length<40}
            style={{padding:"11px 26px",background:form.facts?.trim()?.length>=40?C.red:"#2A1A1E",border:"none",borderRadius:7,color:form.facts?.trim()?.length>=40?"#fff":C.textMut,fontSize:13,fontWeight:500,cursor:form.facts?.trim()?.length>=40?"pointer":"not-allowed",fontFamily:F.sans,letterSpacing:"0.04em"}}
            onMouseEnter={e=>{if(form.facts?.trim()?.length>=40)e.currentTarget.style.background="#B51D30";}}
            onMouseLeave={e=>{if(form.facts?.trim()?.length>=40)e.currentTarget.style.background=C.red;}}>
            ⚖ Generate Strategy Report
          </button>
        </div>
      </div>
    </div>
  );

  if(stage==="generating") return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{height:52,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:8,padding:"0 22px",background:C.bgPanel,flexShrink:0,fontSize:12}}>
        <span style={{color:C.textSec}}>Litigation</span><span style={{color:C.textMut}}>›</span><span style={{color:C.textPri}}>Generating Strategy…</span>
        <span style={{color:C.textMut,margin:"0 4px"}}>·</span>
        <div style={{width:13,height:13,border:`2px solid ${C.border}`,borderTop:`2px solid ${C.red}`,borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>
        <span style={{fontSize:11,color:C.textMut}}>{progress}%</span>
      </div>
      <div ref={scrollRef} style={{flex:1,overflowY:"auto",padding:"28px 36px"}}>
        <div style={{maxWidth:680}}>
          <div style={{height:2,background:C.bgHover,borderRadius:2,marginBottom:20}}><div style={{width:`${progress}%`,height:"100%",background:C.red,borderRadius:2,transition:"width 0.2s"}}/></div>
          <div style={{fontFamily:F.sans,fontSize:12.5,color:C.textPri,lineHeight:1.85,fontWeight:300}}>
            {renderMd(report)}
            {streaming&&<span style={{display:"inline-block",width:2,height:14,background:C.red,marginLeft:1,animation:"blink 1s step-end infinite",verticalAlign:"text-bottom"}}/>}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{height:52,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",background:C.bgPanel,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8,fontSize:12}}>
          <span onClick={()=>setStage("form")} style={{color:C.textSec,cursor:"pointer"}} onMouseEnter={e=>e.target.style.color=C.textPri} onMouseLeave={e=>e.target.style.color=C.textSec}>Litigation</span>
          <span style={{color:C.textMut}}>›</span><span style={{color:C.textPri}}>Strategy Report</span>
          <span style={{color:C.textMut,margin:"0 4px"}}>·</span>
          <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:6,height:6,borderRadius:"50%",background:C.green,animation:"pulse 2s infinite"}}/><span style={{fontSize:9,color:C.green,letterSpacing:"0.08em"}}>COMPLETE</span></div>
        </div>
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>{setStage("form");setReport("");}} style={{padding:"5px 12px",background:"transparent",border:`1px solid ${C.border}`,borderRadius:5,color:C.textSec,fontSize:11,cursor:"pointer",fontFamily:F.sans}}>← New Matter</button>
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
          <div style={{fontSize:9,color:C.textMut,letterSpacing:"0.13em",textTransform:"uppercase",marginBottom:10}}>Matter Details</div>
          {[["Position",form.position],["Court",form.court],["Domain",form.domain],["Opponent",form.opponent]].map(([k,v])=>v&&(
            <div key={k} style={{marginBottom:10,padding:"8px 10px",background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:6}}>
              <div style={{fontSize:9,color:C.textMut,marginBottom:2}}>{k}</div>
              <div style={{fontSize:11,color:C.textPri,fontFamily:F.sans,lineHeight:1.4}}>{v}</div>
            </div>
          ))}
          <div style={{marginTop:10,padding:"9px 10px",background:C.redFaint,border:`1px solid ${C.redGlow}`,borderRadius:6}}>
            <div style={{fontSize:9,color:C.amber,fontWeight:600,letterSpacing:"0.08em",marginBottom:3}}>REMINDER</div>
            <p style={{fontSize:10,color:C.textMut,lineHeight:1.5}}>Verify all citations with SCC Online / Manupatra before filing.</p>
          </div>
        </div>
      </div>
      {exportModal&&<ExportModal defaultName="litigation_strategy_astreya" content={report} title={`Litigation Strategy — ${form.domain||'Matter'}`} onClose={()=>setExportModal(false)}/>}
    </div>
  );
}
