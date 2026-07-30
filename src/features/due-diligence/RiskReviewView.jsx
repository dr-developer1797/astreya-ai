"use client";

import { useState, useRef, useCallback } from "react";
import { C, F } from "@/shared/constants/theme";
import ExportModal from "@/shared/modals/ExportModal";
import { callLLM, extractResponse } from "@/shared/llm/client";
import { RISK_COLORS, RISK_BG, CONTRACT_TYPES, SAMPLE_CONTRACT } from "@/features/due-diligence/constants";
import { countWords } from "@/shared/utils/text";

export default function RiskReviewView() {
  const [stage, setStage]           = useState("upload");   // upload | analysing | results
  const [contractText, setContractText] = useState("");
  const [contractType, setContractType] = useState("");
  const [perspective, setPerspective]   = useState("neutral");
  const [progress, setProgress]         = useState(0);
  const [statusMsg, setStatusMsg]       = useState("");
  const [results, setResults]           = useState(null);
  const [activeRisk, setActiveRisk]     = useState(null);
  const [filterLevel, setFilterLevel]   = useState("ALL");
  const [exportModal, setExportModal]   = useState(false);
  const fileRef = useRef(null);

  /* ── RUN ANALYSIS ── */
  const runAnalysis = useCallback(async (text, ctype, persp) => {
    setStage("analysing"); setProgress(0);

    const msgs = [
      "Segmenting clauses…", "Checking Indian Contract Act compliance…",
      "Scanning liability provisions…", "Reviewing IP & confidentiality clauses…",
      "Checking dispute resolution mechanism…", "Analysing termination provisions…",
      "Cross-referencing Indian case law…", "Compiling risk report…"
    ];
    let mi = 0;
    setStatusMsg(msgs[0]);
    const ticker = setInterval(() => {
      mi = Math.min(mi + 1, msgs.length - 1);
      setStatusMsg(msgs[mi]);
      setProgress(p => Math.min(p + Math.floor(Math.random() * 14) + 6, 88));
    }, 1800);

    const sys = `You are a senior Indian contracts lawyer specialising in risk analysis. Analyse the provided contract from the perspective of ${persp === "party_a" ? "Party A (first party)" : persp === "party_b" ? "Party B (second party)" : "a neutral reviewer"}. Return ONLY valid JSON — no markdown, no explanation, no code fences. Use this exact schema:
{
  "overall_score": <number 1-10, 10 = highest risk>,
  "contract_type_detected": "<string>",
  "summary": "<2-3 sentence executive summary of key risks>",
  "risks": [
    {
      "id": "R1",
      "clause_ref": "<e.g. Clause 3.1 or Recital B>",
      "clause_excerpt": "<verbatim excerpt, max 180 chars>",
      "risk_level": "<CRITICAL|HIGH|MEDIUM|LOW|INFO>",
      "risk_type": "<short label e.g. Unlimited Liability>",
      "issue": "<2-3 sentences explaining the legal concern under Indian law>",
      "legal_basis": "<primary Indian statute or case law>",
      "suggested_revision": "<improved clause text>"
    }
  ],
  "missing_clauses": ["<clause name>"],
  "positive_clauses": ["<well-drafted clause description>"]
}
Identify 5-9 risks. Be specific to Indian law (Indian Contract Act 1872, Specific Relief Act 1963, relevant labour/IP/arbitration statutes). Return ONLY the JSON object.`;

    const usr = `Contract Type: ${ctype || "Unknown"}\nParty Perspective: ${persp}\n\n${text}`;

    try {
      const res = await callLLM({ sys, messages:[{role:"user",content:usr}], stream:false });
      clearInterval(ticker);
      setProgress(95);
      const data = await res.json();
      const raw  = extractResponse(data) || "{}";
      // strip any accidental markdown fences
      const clean = raw.replace(/```json|```/gi, "").trim();
      const parsed = JSON.parse(clean);
      setResults(parsed);
      setProgress(100);
      setTimeout(() => { setStage("results"); setActiveRisk(parsed.risks?.[0] || null); }, 500);
    } catch (err) {
      clearInterval(ticker);
      setResults({
        overall_score: 0, contract_type_detected: ctype,
        summary: `Analysis error: ${err.message}. Please try again.`,
        risks: [], missing_clauses: [], positive_clauses: [],
      });
      setStage("results");
    }
  }, []);

  const handleAnalyse = () => {
    const txt = contractText.trim();
    if (txt.length < 100) return;
    runAnalysis(txt, contractType, perspective);
  };

  const loadSample = () => setContractText(SAMPLE_CONTRACT);

  const filteredRisks = results?.risks?.filter(r => filterLevel === "ALL" || r.risk_level === filterLevel) || [];
  const scoreColor = results
    ? results.overall_score >= 8 ? RISK_COLORS.CRITICAL
      : results.overall_score >= 6 ? RISK_COLORS.HIGH
      : results.overall_score >= 4 ? RISK_COLORS.MEDIUM
      : RISK_COLORS.LOW
    : C.textMut;

  /* ─ UPLOAD STAGE ─ */
  if (stage === "upload") return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{height:52,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 22px",background:C.bgPanel,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8,fontSize:12}}>
          <span style={{color:C.textSec}}>Due Diligence</span>
          <span style={{color:C.textMut}}>›</span>
          <span style={{color:C.textPri}}>Upload Contract</span>
        </div>
        <button onClick={loadSample} style={{fontSize:11,color:C.textMut,background:"transparent",border:`1px solid ${C.border}`,borderRadius:5,padding:"5px 12px",cursor:"pointer",fontFamily:F.sans,transition:"all 0.15s"}} onMouseEnter={e=>{e.currentTarget.style.color=C.textPri;e.currentTarget.style.borderColor=C.borderMid;}} onMouseLeave={e=>{e.currentTarget.style.color=C.textMut;e.currentTarget.style.borderColor=C.border;}}>
          Load Sample NDA
        </button>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"28px 34px"}}>
        <div style={{maxWidth:780}}>
          <div style={{marginBottom:24}}>
            <div style={{fontFamily:F.serif,fontSize:26,fontWeight:600,color:C.textPri,marginBottom:5}}>Contract Due Diligence</div>
            <p style={{fontSize:13,color:C.textSec,fontFamily:F.sans,fontWeight:300}}>Paste your contract below. Astreya analyses every clause against Indian law — Indian Contract Act, labour statutes, IP law — and flags risks with suggested revisions.</p>
          </div>

          {/* config row */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:18}}>
            <div>
              <div style={{fontSize:11,color:C.textSec,fontFamily:F.sans,marginBottom:6,letterSpacing:"0.02em"}}>Contract Type</div>
              <select value={contractType} onChange={e=>setContractType(e.target.value)} style={{width:"100%",background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:7,padding:"9px 12px",color:contractType?C.textPri:C.textMut,fontSize:12.5,fontFamily:F.sans,outline:"none",cursor:"pointer",appearance:"none"}}>
                <option value="">Auto-detect</option>
                {CONTRACT_TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontSize:11,color:C.textSec,fontFamily:F.sans,marginBottom:6,letterSpacing:"0.02em"}}>Reviewing as</div>
              <div style={{display:"flex",gap:6}}>
                {[["party_a","Party A"],["party_b","Party B"],["neutral","Neutral"]].map(([v,l])=>(
                  <div key={v} onClick={()=>setPerspective(v)}
                    style={{flex:1,padding:"8px 6px",textAlign:"center",borderRadius:7,border:`1px solid ${perspective===v?C.red:C.border}`,background:perspective===v?C.redFaint:"transparent",cursor:"pointer",fontSize:11,color:perspective===v?C.red:C.textSec,fontFamily:F.sans,transition:"all 0.15s"}}>
                    {l}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* text area */}
          <div style={{position:"relative",marginBottom:16}}>
            <textarea
              value={contractText} onChange={e=>setContractText(e.target.value)}
              placeholder={"Paste your contract here…\n\nSupports: NDA, Employment, Service, SPA, Lease, MOU, Legal Notices and more.\nMinimum 100 characters required for analysis."}
              style={{width:"100%",minHeight:320,background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:9,padding:"16px 18px",color:C.textPri,fontSize:12.5,fontFamily:F.sans,fontWeight:300,outline:"none",resize:"vertical",lineHeight:1.8}}
              onFocus={e=>e.target.style.borderColor=C.borderMid}
              onBlur={e=>e.target.style.borderColor=C.border}
            />
            {contractText && (
              <div style={{position:"absolute",bottom:12,right:14,fontSize:10,color:C.textMut,fontFamily:F.sans}}>
                {countWords(contractText.trim())} words
              </div>
            )}
          </div>

          {/* or upload */}
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
            <div style={{flex:1,height:1,background:C.border}}/>
            <span style={{fontSize:10,color:C.textMut,fontFamily:F.sans,letterSpacing:"0.08em"}}>OR</span>
            <div style={{flex:1,height:1,background:C.border}}/>
          </div>
          <div onClick={()=>fileRef.current?.click()}
            style={{border:`1px dashed ${C.borderMid}`,borderRadius:9,padding:"18px 24px",textAlign:"center",cursor:"pointer",marginBottom:22,transition:"all 0.15s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.red;e.currentTarget.style.background=C.redFaint;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.borderMid;e.currentTarget.style.background="transparent";}}>
            <div style={{fontSize:20,marginBottom:6}}>📎</div>
            <div style={{fontSize:12,color:C.textSec,fontFamily:F.sans}}>Click to upload a .txt or .md contract file</div>
            <div style={{fontSize:10,color:C.textMut,marginTop:3,fontFamily:F.sans}}>PDF parsing coming soon</div>
            <input ref={fileRef} type="file" accept=".txt,.md" style={{display:"none"}} onChange={e=>{
              const f=e.target.files?.[0]; if(!f)return;
              const r=new FileReader(); r.onload=ev=>setContractText(ev.target?.result||""); r.readAsText(f);
            }}/>
          </div>

          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <button onClick={handleAnalyse} disabled={contractText.trim().length < 100}
              style={{padding:"11px 28px",background:contractText.trim().length>=100?C.red:"#2A1A1E",border:"none",borderRadius:7,color:contractText.trim().length>=100?"#fff":C.textMut,fontSize:13,fontWeight:500,cursor:contractText.trim().length>=100?"pointer":"not-allowed",fontFamily:F.sans,letterSpacing:"0.04em",transition:"all 0.15s"}}
              onMouseEnter={e=>{if(contractText.trim().length>=100)e.currentTarget.style.background="#B51D30";}}
              onMouseLeave={e=>{if(contractText.trim().length>=100)e.currentTarget.style.background=C.red;}}>
              ⚑ Run Risk Analysis
            </button>
            {contractText.trim().length > 0 && contractText.trim().length < 100 && (
              <span style={{fontSize:11,color:C.amber,fontFamily:F.sans}}>{100 - contractText.trim().length} more characters needed</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  /* ─ ANALYSING STAGE ─ */
  if (stage === "analysing") return (
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px",gap:0}}>
      {/* animated shield */}
      <div style={{width:72,height:72,background:C.redFaint,border:`1px solid ${RISK_COLORS.CRITICAL}44`,borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:28,fontSize:32,animation:"pulse 1.5s ease infinite"}}>⚑</div>
      <div style={{fontFamily:F.serif,fontSize:22,fontWeight:600,color:C.textPri,marginBottom:8}}>Analysing Contract</div>
      <div style={{fontSize:12,color:C.textSec,fontFamily:F.sans,marginBottom:32,fontWeight:300}}>{statusMsg}</div>
      {/* progress bar */}
      <div style={{width:360,height:3,background:C.bgHover,borderRadius:2,marginBottom:8}}>
        <div style={{width:`${progress}%`,height:"100%",background:`linear-gradient(90deg,${C.red},${RISK_COLORS.HIGH})`,borderRadius:2,transition:"width 0.4s ease"}}/>
      </div>
      <div style={{fontSize:11,color:C.textMut,fontFamily:F.sans}}>{progress}%</div>
      <div style={{marginTop:36,display:"flex",gap:18}}>
        {[["🔍","Clause scan"],["⚖","Indian law check"],["📋","Risk scoring"],["✦","Report generation"]].map(([ic,l],i)=>(
          <div key={i} style={{textAlign:"center",opacity:progress > i*22 ? 1 : 0.3,transition:"opacity 0.5s"}}>
            <div style={{fontSize:18,marginBottom:4}}>{ic}</div>
            <div style={{fontSize:10,color:C.textMut,fontFamily:F.sans}}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );

  /* ─ RESULTS STAGE ─ */
  const buildRiskText = (r) => {
    if (!r) return "";
    let t = `DUE DILIGENCE RISK REPORT\n${"=".repeat(50)}\n\nContract: ${r.contract_type_detected||"Unknown"}\nOverall Risk Score: ${r.overall_score||0}/10\n\nEXECUTIVE SUMMARY\n${"-".repeat(40)}\n${r.summary||""}\n\nIDENTIFIED RISKS\n${"-".repeat(40)}\n`;
    (r.risks||[]).forEach(risk => { t += `\n## [${risk.risk_level}] ${risk.clause_ref} — ${risk.risk_type}\nExcerpt: "${risk.clause_excerpt}"\nIssue: ${risk.issue}\nLegal Basis: ${risk.legal_basis}\nSuggested Revision: ${risk.suggested_revision}\n`; });
    if (r.missing_clauses?.length) { t += `\nMISSING CLAUSES\n${"-".repeat(40)}\n`; r.missing_clauses.forEach(c => t += `• ${c}\n`); }
    if (r.positive_clauses?.length) { t += `\nWELL-DRAFTED CLAUSES\n${"-".repeat(40)}\n`; r.positive_clauses.forEach(c => t += `✓ ${c}\n`); }
    t += `\n⚠ Preliminary AI analysis — consult a qualified advocate before acting.`;
    return t;
  };
  const countByLevel = (lvl) => results?.risks?.filter(r=>r.risk_level===lvl).length || 0;

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {/* topbar */}
      <div className="ast-view-header" style={{height:52,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",background:C.bgPanel,flexShrink:0}}>
        <div className="ast-view-header-title" style={{display:"flex",alignItems:"center",gap:8,fontSize:12,minWidth:0,flexWrap:"wrap"}}>
          <span onClick={()=>setStage("upload")} style={{color:C.textSec,cursor:"pointer"}} onMouseEnter={e=>e.target.style.color=C.textPri} onMouseLeave={e=>e.target.style.color=C.textSec}>Due Diligence</span>
          <span style={{color:C.textMut}}>›</span>
          <span style={{color:C.textPri,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:180}}>{results?.contract_type_detected || contractType || "Contract"}</span>
          <span style={{color:C.textMut,margin:"0 4px"}}>·</span>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:scoreColor,animation:"pulse 2s infinite"}}/>
            <span style={{fontSize:9,color:scoreColor,letterSpacing:"0.08em",fontWeight:600}}>RISK {results?.overall_score?.toFixed(1)}/10</span>
          </div>
        </div>
        <div className="ast-view-header-actions ast-filter-row" style={{display:"flex",gap:7}}>
          {["ALL","CRITICAL","HIGH","MEDIUM","LOW"].map(lvl=>(
            <div key={lvl} onClick={()=>setFilterLevel(lvl)}
              style={{padding:"4px 10px",borderRadius:4,border:`1px solid ${filterLevel===lvl?(RISK_COLORS[lvl]||C.red):C.border}`,background:filterLevel===lvl?(RISK_BG[lvl]||C.redFaint):"transparent",fontSize:9,color:filterLevel===lvl?(RISK_COLORS[lvl]||C.red):C.textMut,cursor:"pointer",letterSpacing:"0.07em",fontFamily:F.sans,fontWeight:600,transition:"all 0.15s"}}>
              {lvl}{lvl!=="ALL"&&countByLevel(lvl)>0&&<span style={{marginLeft:4,opacity:0.7}}>·{countByLevel(lvl)}</span>}
            </div>
          ))}
          <div style={{width:1,height:20,background:C.border,alignSelf:"center",margin:"0 2px"}}/>
          <button onClick={()=>setStage("upload")} style={{padding:"5px 12px",background:"transparent",border:`1px solid ${C.border}`,borderRadius:5,color:C.textSec,fontSize:11,cursor:"pointer",fontFamily:F.sans}}>← New Review</button>
          <button onClick={()=>setExportModal(true)} style={{padding:"5px 12px",background:"transparent",border:`1px solid ${C.border}`,borderRadius:5,color:C.textSec,fontSize:11,cursor:"pointer",fontFamily:F.sans}}>↓ Export Word</button>
        </div>
      </div>

      <div className="ast-three-col" style={{flex:1,display:"flex",overflow:"hidden"}}>

        {/* ── LEFT: risk list ── */}
        <div className="ast-panel-l ast-panel-l-narrow" style={{width:308,borderRight:`1px solid ${C.border}`,background:C.bgPanel,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          {/* score summary */}
          <div style={{padding:"16px 16px 12px",borderBottom:`1px solid ${C.border}`}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <div>
                <div style={{fontSize:9,color:C.textMut,letterSpacing:"0.13em",textTransform:"uppercase",marginBottom:4}}>Overall Risk Score</div>
                <div style={{fontFamily:F.serif,fontSize:32,fontWeight:700,color:scoreColor,lineHeight:1}}>{results?.overall_score?.toFixed(1)}</div>
                <div style={{fontSize:9,color:C.textMut,marginTop:2,fontFamily:F.sans}}>out of 10</div>
              </div>
              {/* mini donut visual */}
              <div style={{width:56,height:56,position:"relative"}}>
                <svg viewBox="0 0 56 56" style={{transform:"rotate(-90deg)"}}>
                  <circle cx="28" cy="28" r="22" fill="none" stroke={C.bgHover} strokeWidth="5"/>
                  <circle cx="28" cy="28" r="22" fill="none" stroke={scoreColor} strokeWidth="5"
                    strokeDasharray={`${(results?.overall_score/10)*138} 138`}
                    strokeLinecap="round" style={{transition:"stroke-dasharray 1s ease"}}/>
                </svg>
              </div>
            </div>
            {/* risk count pills */}
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {[["CRITICAL",RISK_COLORS.CRITICAL],["HIGH",RISK_COLORS.HIGH],["MEDIUM",RISK_COLORS.MEDIUM],["LOW",RISK_COLORS.LOW]].map(([lvl,col])=>{
                const n=countByLevel(lvl);
                if(!n) return null;
                return <span key={lvl} style={{fontSize:9,color:col,background:`${col}18`,border:`1px solid ${col}33`,borderRadius:20,padding:"2px 8px",fontWeight:600,letterSpacing:"0.07em"}}>{n} {lvl}</span>;
              })}
            </div>
          </div>

          {/* risk list */}
          <div style={{flex:1,overflowY:"auto",padding:"10px 10px"}}>
            <div style={{fontSize:9,color:C.textMut,letterSpacing:"0.13em",textTransform:"uppercase",marginBottom:8,paddingLeft:4}}>
              {filteredRisks.length} {filterLevel==="ALL"?"Total Risks":"Filtered"}
            </div>
            {filteredRisks.length === 0 && (
              <div style={{padding:"24px 16px",textAlign:"center",color:C.textMut,fontSize:12,fontFamily:F.sans}}>No risks at this level.</div>
            )}
            {filteredRisks.map((risk,i)=>{
              const col = RISK_COLORS[risk.risk_level] || C.textMut;
              const isActive = activeRisk?.id === risk.id;
              return (
                <div key={risk.id} onClick={()=>setActiveRisk(risk)}
                  style={{background:isActive?`${col}0D`:C.bgCard,border:`1px solid ${isActive?col:C.border}`,borderRadius:8,padding:"11px 12px",marginBottom:7,cursor:"pointer",transition:"all 0.15s",animation:`fadeUp 0.3s ease ${i*0.05}s both`}}
                  onMouseEnter={e=>{if(!isActive){e.currentTarget.style.borderColor=C.borderMid;e.currentTarget.style.background=C.bgHover;}}}
                  onMouseLeave={e=>{if(!isActive){e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background=C.bgCard;}}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:5}}>
                    <span style={{fontSize:9,color:C.textMut,fontFamily:"monospace"}}>{risk.clause_ref}</span>
                    <span style={{fontSize:9,color:col,background:`${col}18`,border:`1px solid ${col}30`,borderRadius:3,padding:"1px 6px",fontWeight:600,letterSpacing:"0.07em"}}>{risk.risk_level}</span>
                  </div>
                  <div style={{fontSize:11.5,color:C.textPri,fontFamily:F.sans,fontWeight:500,marginBottom:4,lineHeight:1.35}}>{risk.risk_type}</div>
                  <div style={{fontSize:10.5,color:C.textMut,fontFamily:F.sans,lineHeight:1.45,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{risk.issue}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── CENTRE: active risk detail ── */}
        <div className="ast-content-pad ast-split-detail" style={{flex:1,overflowY:"auto",padding:"24px 28px",minWidth:0}}>
          {!activeRisk ? (
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:10,color:C.textMut}}>
              <div style={{fontSize:24}}>⚑</div>
              <div style={{fontSize:13,fontFamily:F.sans}}>Select a risk to see details</div>
            </div>
          ) : (
            <div style={{maxWidth:660,animation:"fadeUp 0.3s ease"}}>
              {/* risk header */}
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:20,gap:16}}>
                <div>
                  <div style={{fontSize:9,color:C.textMut,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:5,fontFamily:F.sans}}>{activeRisk.clause_ref}</div>
                  <div style={{fontFamily:F.serif,fontSize:22,fontWeight:600,color:C.textPri,lineHeight:1.25}}>{activeRisk.risk_type}</div>
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6,flexShrink:0}}>
                  <span style={{fontSize:11,color:RISK_COLORS[activeRisk.risk_level],background:RISK_BG[activeRisk.risk_level],border:`1px solid ${RISK_COLORS[activeRisk.risk_level]}44`,borderRadius:5,padding:"4px 12px",fontWeight:600,letterSpacing:"0.07em"}}>{activeRisk.risk_level} RISK</span>
                </div>
              </div>

              {/* clause excerpt */}
              <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderLeft:`3px solid ${RISK_COLORS[activeRisk.risk_level]}`,borderRadius:"0 8px 8px 0",padding:"14px 16px",marginBottom:20}}>
                <div style={{fontSize:9,color:C.textMut,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:7,fontFamily:F.sans}}>Clause Excerpt</div>
                <p style={{fontSize:12.5,color:C.textPri,fontFamily:F.sans,fontWeight:300,lineHeight:1.8,fontStyle:"italic"}}>&ldquo;{activeRisk.clause_excerpt}&rdquo;</p>
              </div>

              {/* issue */}
              <div style={{marginBottom:18}}>
                <div style={{fontSize:9,color:C.textMut,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:8,fontFamily:F.sans}}>Issue</div>
                <p style={{fontSize:13,color:C.textPri,fontFamily:F.sans,fontWeight:300,lineHeight:1.8}}>{activeRisk.issue}</p>
              </div>

              {/* legal basis */}
              <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:20,padding:"10px 14px",background:C.goldDim,borderLeft:`2px solid ${C.gold}`,borderRadius:"0 6px 6px 0"}}>
                <span style={{fontSize:11,color:C.gold,fontWeight:500,whiteSpace:"nowrap",fontFamily:F.sans}}>Legal Basis</span>
                <span style={{fontSize:11.5,color:C.textSec,fontFamily:F.sans}}>{activeRisk.legal_basis}</span>
              </div>

              {/* suggested revision */}
              <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderLeft:`3px solid ${C.green}`,borderRadius:"0 8px 8px 0",padding:"14px 16px",marginBottom:20}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                  <div style={{fontSize:9,color:C.textMut,letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:F.sans}}>Suggested Revision</div>
                  <button onClick={()=>navigator.clipboard?.writeText(activeRisk.suggested_revision)} style={{fontSize:9,color:C.textMut,background:"transparent",border:`1px solid ${C.border}`,borderRadius:4,padding:"2px 8px",cursor:"pointer",fontFamily:F.sans}}>Copy</button>
                </div>
                <p style={{fontSize:12.5,color:C.textPri,fontFamily:F.sans,fontWeight:300,lineHeight:1.8}}>{activeRisk.suggested_revision}</p>
              </div>

              {/* nav between risks */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:16,borderTop:`1px solid ${C.border}`}}>
                <button onClick={()=>{const idx=filteredRisks.findIndex(r=>r.id===activeRisk.id);if(idx>0)setActiveRisk(filteredRisks[idx-1]);}}
                  disabled={filteredRisks.findIndex(r=>r.id===activeRisk.id)===0}
                  style={{padding:"6px 14px",background:"transparent",border:`1px solid ${C.border}`,borderRadius:5,color:C.textSec,fontSize:11,cursor:"pointer",fontFamily:F.sans,opacity:filteredRisks.findIndex(r=>r.id===activeRisk.id)===0?0.3:1}}>← Previous</button>
                <span style={{fontSize:11,color:C.textMut,fontFamily:F.sans}}>{filteredRisks.findIndex(r=>r.id===activeRisk.id)+1} of {filteredRisks.length}</span>
                <button onClick={()=>{const idx=filteredRisks.findIndex(r=>r.id===activeRisk.id);if(idx<filteredRisks.length-1)setActiveRisk(filteredRisks[idx+1]);}}
                  disabled={filteredRisks.findIndex(r=>r.id===activeRisk.id)===filteredRisks.length-1}
                  style={{padding:"6px 14px",background:"transparent",border:`1px solid ${C.border}`,borderRadius:5,color:C.textSec,fontSize:11,cursor:"pointer",fontFamily:F.sans,opacity:filteredRisks.findIndex(r=>r.id===activeRisk.id)===filteredRisks.length-1?0.3:1}}>Next →</button>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: summary panel ── */}
        <div className="ast-panel-r-inline ast-panel-r-narrow" style={{width:228,borderLeft:`1px solid ${C.border}`,background:C.bgPanel,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{flex:1,overflowY:"auto",padding:"15px 14px"}}>
            {/* executive summary */}
            <div style={{fontSize:9,color:C.textMut,letterSpacing:"0.13em",textTransform:"uppercase",marginBottom:7}}>Executive Summary</div>
            <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:8,padding:"12px 13px",marginBottom:16}}>
              <p style={{fontSize:11.5,color:C.textSec,fontFamily:F.sans,fontWeight:300,lineHeight:1.65}}>{results?.summary}</p>
            </div>

            {/* risk breakdown */}
            <div style={{fontSize:9,color:C.textMut,letterSpacing:"0.13em",textTransform:"uppercase",marginBottom:8}}>Risk Breakdown</div>
            {[["CRITICAL",RISK_COLORS.CRITICAL],["HIGH",RISK_COLORS.HIGH],["MEDIUM",RISK_COLORS.MEDIUM],["LOW",RISK_COLORS.LOW],["INFO",RISK_COLORS.INFO]].map(([lvl,col])=>{
              const n = countByLevel(lvl);
              const total = results?.risks?.length || 1;
              return (
                <div key={lvl} style={{marginBottom:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:10,color:col,fontFamily:F.sans,fontWeight:600,letterSpacing:"0.06em"}}>{lvl}</span>
                    <span style={{fontSize:10,color:C.textMut,fontFamily:F.sans}}>{n}</span>
                  </div>
                  <div style={{height:3,background:C.bgHover,borderRadius:2}}>
                    <div style={{width:`${(n/total)*100}%`,height:"100%",background:col,borderRadius:2,transition:"width 0.8s ease"}}/>
                  </div>
                </div>
              );
            })}

            {/* missing clauses */}
            {results?.missing_clauses?.length > 0 && (
              <>
                <div style={{fontSize:9,color:C.textMut,letterSpacing:"0.13em",textTransform:"uppercase",marginBottom:8,marginTop:16}}>Missing Clauses</div>
                {results.missing_clauses.map((c,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:7,marginBottom:7,padding:"7px 10px",background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:5}}>
                    <div style={{width:5,height:5,borderRadius:"50%",background:C.amber,flexShrink:0}}/>
                    <span style={{fontSize:10.5,color:C.textSec,fontFamily:F.sans}}>{c}</span>
                  </div>
                ))}
              </>
            )}

            {/* positives */}
            {results?.positive_clauses?.length > 0 && (
              <>
                <div style={{fontSize:9,color:C.textMut,letterSpacing:"0.13em",textTransform:"uppercase",marginBottom:8,marginTop:16}}>Well-Drafted Clauses</div>
                {results.positive_clauses.map((c,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:7,marginBottom:7,padding:"7px 10px",background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:5}}>
                    <div style={{color:C.green,fontSize:12,marginTop:1,flexShrink:0}}>✓</div>
                    <span style={{fontSize:10.5,color:C.textSec,fontFamily:F.sans,lineHeight:1.4}}>{c}</span>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* disclaimer */}
          <div style={{padding:"10px 13px",borderTop:`1px solid ${C.border}`}}>
            <div style={{padding:"9px 10px",background:`${C.amber}0E`,border:`1px solid ${C.amber}33`,borderRadius:6}}>
              <div style={{fontSize:9,color:C.amber,fontWeight:600,letterSpacing:"0.08em",marginBottom:3}}>REMINDER</div>
              <p style={{fontSize:10,color:C.textMut,lineHeight:1.5}}>AI risk analysis is preliminary. Consult a qualified advocate before acting on this report.</p>
            </div>
          </div>
        </div>

      </div>
      {exportModal&&<ExportModal defaultName="due_diligence_astreya" content={buildRiskText(results)} title="Due Diligence Risk Report" onClose={()=>setExportModal(false)}/>}
    </div>
  );
}
