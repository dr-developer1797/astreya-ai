"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { C, F } from "@/shared/constants/theme";
import Btn from "@/shared/ui/Btn";
import Spinner from "@/shared/ui/Spinner";
import Label from "@/shared/ui/Label";
import Field from "@/shared/ui/Field";
import ReminderCard from "@/shared/ui/ReminderCard";
import ViewHeader from "@/shared/ui/ViewHeader";
import ExportModal from "@/shared/modals/ExportModal";
import { callLLM, extractResponse } from "@/shared/llm/client";
import { useLLMStream } from "@/shared/hooks/useLLMStream";
import { DOC_TYPES, INTAKE } from "@/shared/constants/documents";
import { DEMO_DRAFT } from "@/features/drafting/demo";
import { saveDraft } from "@/shared/storage/drafts";
import { countWords } from "@/shared/utils/text";
import { useFormState } from "@/shared/hooks/useFormState";
import { useTimeoutCleanup } from "@/shared/hooks/useTimeoutCleanup";
import { useMatter } from "@/shared/context/MatterContext";

const CHECKLIST_ITEMS = [
  "Parties correctly identified",
  "Governing law clause present",
  "Dispute resolution mechanism",
  "Execution / signature block",
  "Stamp duty obligation checked",
  "Annexures complete",
];

export default function DraftingView() {
  const { matterId } = useMatter();
  const { streaming, text: streamPreview, progress, stream, reset } = useLLMStream();
  const { scheduleTimeout } = useTimeoutCleanup();
  const [stage, setStage]             = useState("select"); // select | intake | generating | editor
  const [docType, setDocType]         = useState(null);
  const [form, setF, setForm]         = useFormState({});
  const [notes, setNotes]             = useState("");
  const [docText, setDocText]         = useState("");
  const [wordCount, setWordCount]     = useState(0);
  const [clausePanel, setClausePanel] = useState(null);
  const [clauseAI, setClauseAI]       = useState("");
  const [clauseLoad, setClauseLoad]   = useState(false);
  const [exportModal, setExportModal] = useState(false);
  const [checklist, setChecklist]     = useState(() => new Set());
  const [demoStreaming, setDemoStreaming] = useState(false);
  const [demoProgress, setDemoProgress] = useState(0);
  const editorWrap = useRef(null);

  const isGenerating = streaming || demoStreaming;
  const generatingText = streaming ? streamPreview : docText;
  const generatingProgress = demoStreaming ? demoProgress : progress;

  const toggleChecklist = (item) => {
    setChecklist((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  };

  const dtInfo  = DOC_TYPES.find(d=>d.id===docType);
  // Memoised so the identity stays stable across renders; generate() depends on it.
  const fields  = useMemo(() => (docType ? (INTAKE[docType] || INTAKE.nda) : []), [docType]);
  const filled  = fields.filter(f=>form[f.key]?.trim()).length;
  const pct     = fields.length ? Math.round((filled/fields.length)*100) : 0;

  /* ── GENERATE ── */
  const generate = useCallback(async () => {
    if (!docType) return;
    setStage("generating");
    reset();
    const label  = dtInfo?.label || docType;
    const flist  = fields.map(f=>`${f.label}: ${form[f.key]||"[not provided]"}`).join("\n");
    const notesSection = notes.trim() ? `\n\nADDITIONAL INSTRUCTIONS FROM USER:\n${notes.trim()}` : "";
    // Markdown is banned because the editor renders this text verbatim, so asterisks and
    // hashes would show up literally. Keep this prompt terse: the model emits a hidden
    // thought step that is billed against the same MAX_TOKENS budget as the document, and
    // measurements show elaborate prompts (word caps, clause inventories, "do not
    // deliberate" directives) all make it deliberate longer and finish less often. A short
    // instruction plus a short target document is what actually reaches the signature block.
    const sys = `Draft a complete, execution-ready ${label} under Indian law. Plain text only — no markdown, no asterisks, no hash headings. Numbered clauses, one short paragraph each. Always reach the signature block for both parties. Output only the document.`;
    const usr = `Draft a complete ${label} using these details:\n\n${flist}${notesSection}`;
    try {
      const full = await stream({
        sys,
        messages: [{ role: "user", content: usr }],
        charBudget: 3200,
      });
      if (!full) {
        setStage("intake");
        return;
      }
      setDocText(full);
      setWordCount(countWords(full));
      try {
        await saveDraft({
          typeId: docType,
          typeLabel: dtInfo?.label || docType,
          typeIcon: dtInfo?.icon || "📝",
          typeShort: dtInfo?.short || "Doc",
          category: dtInfo?.category || "General",
          matterId,
          form: { ...form },
          notes,
          content: full,
          createdAt: new Date().toISOString(),
        });
      } catch { /* storage unavailable */ }
      scheduleTimeout(() => setStage("editor"), 400);
    } catch (err) {
      setDocText(`[Error: ${err.message}. Please try again.]`);
      setStage("editor");
    }
  }, [docType, form, notes, dtInfo, fields, matterId, stream, reset, scheduleTimeout]);

  /* ── DEMO ── */
  // Replays a canned NDA through the real generating → editor flow so the app can be
  // shown end-to-end without a model running.
  const demo = useCallback(() => {
    if (isGenerating) return;
    const text = DEMO_DRAFT.content;
    setDocType(DEMO_DRAFT.docType);
    setForm({ ...DEMO_DRAFT.form });
    setNotes(DEMO_DRAFT.notes);
    setDocText(""); setDemoProgress(0); setWordCount(0);
    setStage("generating"); setDemoStreaming(true);

    const chunk = Math.max(4, Math.ceil(text.length / 700));
    let i = 0;
    const tick = () => {
      if (i >= text.length) {
        setDemoProgress(100);
        setWordCount(countWords(text));
        setDocText(text);
        scheduleTimeout(() => { setStage("editor"); setDemoStreaming(false); }, 400);
        return;
      }
      i = Math.min(text.length, i + chunk);
      setDocText(text.slice(0, i));
      setDemoProgress(Math.min(99, Math.round((i/text.length)*100)));
      scheduleTimeout(tick, 12);
    };
    scheduleTimeout(tick, 300);
  }, [isGenerating, setForm, scheduleTimeout]);

  /* ── CLAUSE ANALYSE ── */
  const analyseClause = useCallback(async (text) => {
    setClauseAI(""); setClauseLoad(true);
    try {
      const res = await callLLM({
        messages:[{role:"user",content:`You are a senior Indian contracts lawyer. Analyse this clause:\n\n"${text}"\n\nRespond in exactly this format:\nRISK: [CRITICAL/HIGH/MEDIUM/LOW] — [one-line reason]\nISSUE: [1-2 sentences on the legal concern under Indian law]\nREVISION: [Improved clause text]\n\nNo other text.`}],
        stream:false,
      });
      const d = await res.json();
      setClauseAI(extractResponse(d) || "No analysis available.");
    } catch { setClauseAI("Error analysing clause."); }
    setClauseLoad(false);
  }, []);

  const handleSelect = () => {
    const sel = window.getSelection();
    if (!sel||sel.isCollapsed||sel.toString().trim().length<20) { setClausePanel(null); return; }
    const text = sel.toString().trim();
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    const wrap = editorWrap.current?.getBoundingClientRect();
    if (!wrap) return;
    setClausePanel({ text, top: rect.bottom - wrap.top + 8, left: Math.max(0, rect.left - wrap.left) });
    analyseClause(text);
  };

  /* ─ SELECT ─ */
  if (stage==="select") return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <ViewHeader
        crumbs={[{ label: "Drafting" }, { label: "Select Document Type" }]}
        actions={<Btn onClick={demo} className="ast-hide-mobile">↻ Demo Mode</Btn>}
      />
      <div className="ast-content-pad-lg" style={{flex:1,overflowY:"auto",padding:"30px 34px"}}>
        <div style={{marginBottom:26}}>
          <div style={{fontFamily:F.serif,fontSize:26,fontWeight:600,color:C.textPri,marginBottom:5}}>What would you like to draft?</div>
          <p style={{fontSize:13,color:C.textSec,fontFamily:F.sans,fontWeight:300}}>Select a document type. Astreya will draft a complete, India-law-compliant agreement in seconds — then let you refine every clause.</p>
        </div>
        {["Corporate","Commercial","Labour","Property","Litigation"].map(cat=>{
          const types = DOC_TYPES.filter(d=>d.category===cat);
          if (!types.length) return null;
          return (
            <div key={cat} style={{marginBottom:22}}>
              <Label>{cat}</Label>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(205px,1fr))",gap:9}} className="ast-doc-grid">
                {types.map(dt=>(
                  <div key={dt.id} onClick={()=>{setDocType(dt.id);setForm({});setNotes("");setStage("intake");}}
                    style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:9,padding:"15px 17px",cursor:"pointer",transition:"all 0.15s",animation:"fadeUp 0.3s ease both"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=C.red;e.currentTarget.style.background=C.redFaint;}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background=C.bgCard;}}
                  >
                    <div style={{fontSize:18,marginBottom:9}}>{dt.icon}</div>
                    <div style={{fontSize:13,fontWeight:500,color:C.textPri,marginBottom:3,fontFamily:F.sans}}>{dt.label}</div>
                    <div style={{fontSize:10,color:C.textMut}}>Indian law · AI-generated</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  /* ─ INTAKE ─ */
  if (stage==="intake") return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <ViewHeader
        crumbs={[
          { label: "Drafting", onClick: () => setStage("select") },
          { label: dtInfo?.label, maxWidth: 240 },
        ]}
        status={<span style={{ fontSize: 11, color: pct === 100 ? C.green : C.textMut, fontFamily: F.sans }}>{pct}% complete</span>}
        actions={
          <div className="ast-intake-actions" style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <Btn onClick={() => setStage("select")}>← Back</Btn>
            <Btn primary onClick={generate}>Generate Draft →</Btn>
          </div>
        }
      />
      <div className="ast-content-pad-lg" style={{flex:1,overflowY:"auto",padding:"26px 34px"}}>
        <div style={{maxWidth:660}}>
          {/* header card */}
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:22,padding:"14px 17px",background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:9}}>
            <span style={{fontSize:22}}>{dtInfo?.icon}</span>
            <div>
              <div style={{fontFamily:F.serif,fontSize:19,fontWeight:600,color:C.textPri}}>{dtInfo?.label}</div>
              <div style={{fontSize:11,color:C.textSec,marginTop:1,fontFamily:F.sans,fontWeight:300}}>Fill in the details below. All fields improve draft quality — Astreya handles the legal language and formatting.</div>
            </div>
          </div>
          {/* progress */}
          <div style={{marginBottom:22,height:2,background:C.bgHover,borderRadius:2}}>
            <div style={{width:`${pct}%`,height:"100%",background:`linear-gradient(90deg,${C.red},${C.gold})`,borderRadius:2,transition:"width 0.3s"}}/>
          </div>
          {/* fields */}
          {fields.map((f,i)=>(
            <div key={f.key} style={{marginBottom:16,animation:`fadeUp 0.28s ease ${i*0.04}s both`}}>
              <label style={{display:"block",fontSize:11,color:C.textSec,fontFamily:F.sans,marginBottom:6,letterSpacing:"0.02em"}}>{f.label}</label>
              <Field field={f} value={form[f.key]} onChange={setF} />
            </div>
          ))}

          {/* ── NOTES / PREFERENCES ── */}
          <div style={{marginTop:8,marginBottom:6,animation:`fadeUp 0.28s ease ${(fields.length)*0.04}s both`}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
              <label style={{fontSize:11,color:C.textSec,fontFamily:F.sans,letterSpacing:"0.02em"}}>
                Additional Instructions & Preferences
                <span style={{marginLeft:6,fontSize:9,color:C.textMut,background:C.bgHover,border:`1px solid ${C.border}`,borderRadius:3,padding:"1px 6px",letterSpacing:"0.07em"}}>OPTIONAL</span>
              </label>
              {notes.trim() && <span style={{fontSize:9,color:C.green,fontFamily:F.sans}}>{notes.trim().split(/\s+/).length} words</span>}
            </div>
            <textarea
              value={notes}
              onChange={e=>setNotes(e.target.value)}
              placeholder={`Tell Astreya anything that makes this document unique to your situation. Examples:\n• "Make the IP ownership clause strongly favour the vendor"\n• "We need a strict 30-day payment term with 18% p.a. interest on delay"\n• "Include a step-in rights clause for SLA breaches"\n• "The receiving party is a government PSU — add appropriate sovereign immunity carve-outs"\n• "Prefer a shorter, plain-English style — avoid legalese where possible"\n• "This is for a bootstrapped startup — keep formalities minimal"`}
              style={{width:"100%",background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:7,padding:"11px 13px",color:C.textPri,fontSize:12,fontFamily:F.sans,outline:"none",resize:"vertical",minHeight:120,lineHeight:1.7,fontWeight:300,transition:"border-color 0.15s"}}
              onFocus={e=>{e.target.style.borderColor=C.red;e.target.style.boxShadow=`0 0 0 1px ${C.redGlow}`;}}
              onBlur={e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow="none";}}
            />
            <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>
              {[
                "Favour the vendor",
                "Strict payment terms",
                "Plain English style",
                "Minimal formalities",
                "Step-in rights clause",
                "Strong IP protection",
              ].map(chip=>(
                <span key={chip} onClick={()=>setNotes(n=>n?(n+"\n• "+chip):"• "+chip)}
                  style={{fontSize:9,color:C.textMut,background:C.bgHover,border:`1px solid ${C.border}`,borderRadius:3,padding:"2px 8px",cursor:"pointer",fontFamily:F.sans,letterSpacing:"0.04em",transition:"all 0.12s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=C.red;e.currentTarget.style.color=C.red;}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.textMut;}}
                >{chip}</span>
              ))}
            </div>
          </div>
          <div style={{padding:"9px 13px",background:C.bgCard,border:`1px solid ${C.border}`,borderLeft:`2px solid ${C.amber}`,borderRadius:"0 6px 6px 0",marginTop:6,marginBottom:18}}>
            <p style={{fontSize:10.5,color:C.textMut,lineHeight:1.6,fontFamily:F.sans}}><span style={{color:C.amber,fontWeight:600}}>Note.</span> Generated drafts are starting points. Have a qualified advocate review before execution. State stamp duty obligations may apply.</p>
          </div>
          <Btn primary onClick={generate} style={{padding:"10px 22px",fontSize:12.5}}>✦ Generate {dtInfo?.label} →</Btn>
        </div>
      </div>
    </div>
  );

  /* ─ GENERATING ─ */
  if (stage==="generating") return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <ViewHeader
        crumbs={[{ label: "Drafting", muted: true }, { label: dtInfo?.label }]}
        status={<><Spinner /><span style={{ fontSize: 11, color: C.textMut, marginLeft: 6 }}>Generating…</span></>}
      />
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        {/* live preview */}
        <div style={{flex:1,overflowY:"auto",padding:"26px 34px"}}>
          <div style={{maxWidth:690}}>
            <div style={{marginBottom:18}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <span style={{fontSize:11,color:C.textSec,fontFamily:F.sans}}>Drafting {dtInfo?.label}…</span>
                <span style={{fontSize:11,color:C.red,fontWeight:600}}>{generatingProgress}%</span>
              </div>
              <div style={{height:2,background:C.bgHover,borderRadius:2}}>
                <div style={{width:`${generatingProgress}%`,height:"100%",background:C.red,borderRadius:2,transition:"width 0.2s"}}/>
              </div>
            </div>
            <div style={{fontFamily:F.sans,fontSize:12.5,color:C.textPri,lineHeight:1.88,fontWeight:300,whiteSpace:"pre-wrap"}}>
              {generatingText}
              {isGenerating&&<span style={{display:"inline-block",width:2,height:14,background:C.red,marginLeft:1,animation:"blink 1s step-end infinite",verticalAlign:"text-bottom"}}/>}
            </div>
          </div>
        </div>
        {/* status sidebar */}
        <div className="ast-editor-side ast-panel-r-narrow" style={{width:220,borderLeft:`1px solid ${C.border}`,background:C.bgPanel,padding:"18px 15px"}}>
          <Label>Generation Status</Label>
          {[
            {l:"Recitals & Definitions",done:generatingProgress>12},
            {l:"Core Obligations",     done:generatingProgress>30},
            {l:"Representations",      done:generatingProgress>48},
            {l:"Term & Termination",   done:generatingProgress>62},
            {l:"Dispute Resolution",   done:generatingProgress>76},
            {l:"General Provisions",   done:generatingProgress>88},
            {l:"Signature Block",      done:generatingProgress>=100},
          ].map((item,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:9}}>
              <div style={{width:15,height:15,borderRadius:"50%",border:`1.5px solid ${item.done?C.green:C.border}`,background:item.done?`${C.green}20`:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                {item.done&&<div style={{width:5,height:5,borderRadius:"50%",background:C.green}}/>}
              </div>
              <span style={{fontSize:11,color:item.done?C.textPri:C.textMut,fontFamily:F.sans}}>{item.l}</span>
            </div>
          ))}
          <div style={{marginTop:16,padding:"10px",background:C.redFaint,border:`1px solid ${C.redGlow}`,borderRadius:6}}>
            <div style={{fontSize:9,color:C.red,fontWeight:600,letterSpacing:"0.08em",marginBottom:4}}>APPLYING</div>
            <div style={{fontSize:10,color:C.textMut,lineHeight:1.5}}>Indian Contract Act 1872 · Arbitration & Conciliation Act 1996 · State-specific laws</div>
          </div>
        </div>
      </div>
    </div>
  );

  /* ─ EDITOR ─ */
  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <ViewHeader
        crumbs={[
          { label: "Drafting", onClick: () => setStage("select") },
          { label: dtInfo?.label },
        ]}
        status={
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 9, color: C.green, letterSpacing: "0.08em" }}>DRAFT READY</span>
          </div>
        }
        actions={
          <>
            <span style={{ fontSize: 11, color: C.textMut, fontFamily: F.sans, marginRight: 4 }}>{wordCount.toLocaleString()} words</span>
            <Btn onClick={() => { setStage("intake"); setDocText(""); setNotes(""); }}>← Regenerate</Btn>
            <Btn onClick={() => setExportModal(true)}>↓ Export Word</Btn>
            <Btn onClick={() => navigator.clipboard?.writeText(docText)}>Copy</Btn>
            <Btn primary>Save to Matter</Btn>
          </>
        }
      />
      {exportModal&&<ExportModal defaultName={`${dtInfo?.short||"draft"}_astreya`} content={docText} title={dtInfo?.label||"Legal Document"} onClose={()=>setExportModal(false)}/>}

      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        {/* editor canvas */}
        <div ref={editorWrap} style={{flex:1,overflowY:"auto",padding:"28px 36px",position:"relative"}} onMouseUp={handleSelect}>
          <div style={{marginBottom:16,padding:"8px 13px",background:`${C.blue}0E`,border:`1px solid ${C.blue}28`,borderRadius:6,display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:12}}>✦</span>
            <span style={{fontSize:11,color:C.textSec,fontFamily:F.sans}}>Select any clause or sentence to get AI risk analysis and a suggested rewrite.</span>
          </div>
          {/* document paper */}
          <div style={{maxWidth:680,background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:9,padding:"34px 38px",position:"relative"}}>
            <div style={{fontFamily:F.sans,fontSize:12.5,color:C.textPri,lineHeight:1.92,fontWeight:300,whiteSpace:"pre-wrap"}}>
              {docText}
            </div>
          </div>

          {/* clause popup */}
          {clausePanel&&(
            <div style={{position:"absolute",top:clausePanel.top,left:Math.min(clausePanel.left,350),width:340,background:C.bgPanel,border:`1px solid ${C.borderMid}`,borderRadius:9,overflow:"hidden",zIndex:50,animation:"fadeUp 0.2s ease",boxShadow:"0 8px 30px rgba(0,0,0,0.55)"}}>
              <div style={{padding:"9px 13px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:10,color:C.textMut,letterSpacing:"0.1em",textTransform:"uppercase"}}>Clause Analysis</span>
                <span onClick={()=>setClausePanel(null)} style={{fontSize:15,color:C.textMut,cursor:"pointer",lineHeight:1}}>×</span>
              </div>
              <div style={{padding:"11px 13px"}}>
                <div style={{padding:"7px 9px",background:C.bgHover,borderRadius:4,fontSize:11,color:C.textSec,fontStyle:"italic",marginBottom:11,lineHeight:1.5,maxHeight:54,overflow:"hidden"}}>
                  &ldquo;{clausePanel.text.slice(0,120)}{clausePanel.text.length>120?"…":""}&rdquo;
                </div>
                {clauseLoad
                  ? <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0"}}><Spinner/><span style={{fontSize:11,color:C.textMut,fontFamily:F.sans}}>Analysing under Indian law…</span></div>
                  : clauseAI
                  ? <div>{clauseAI.split("\n").filter(l=>l.trim()).map((line,i)=>{
                      const m = line.match(/^(RISK|ISSUE|REVISION):\s*(.*)/s);
                      if (!m) return <p key={i} style={{fontSize:11,color:C.textSec,lineHeight:1.6,marginBottom:5,fontFamily:F.sans,fontWeight:300}}>{line}</p>;
                      const [,lbl,rest] = m;
                      const lc = lbl==="RISK"?(rest.includes("CRITICAL")||rest.includes("HIGH")?C.red:rest.includes("MEDIUM")?C.amber:C.green):lbl==="ISSUE"?C.amber:C.green;
                      return (
                        <div key={i} style={{marginBottom:9}}>
                          <span style={{fontSize:9,color:lc,fontWeight:600,letterSpacing:"0.1em"}}>{lbl}</span>
                          <p style={{fontSize:11,color:C.textPri,lineHeight:1.65,marginTop:3,fontFamily:F.sans,fontWeight:300}}>{rest}</p>
                        </div>
                      );
                    })}</div>
                  : null
                }
              </div>
            </div>
          )}
        </div>

        {/* right meta panel */}
        <div className="ast-editor-side ast-panel-r-narrow" style={{width:224,borderLeft:`1px solid ${C.border}`,background:C.bgPanel,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{flex:1,overflowY:"auto",padding:"15px 13px"}}>
            <Label>Document Info</Label>
            <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:8,padding:"12px 13px",marginBottom:15}}>
              {[
                ["Type",     dtInfo?.label],
                ["Law",      form.governing||"India"],
                ["Words",    wordCount.toLocaleString()],
                ["Created",  new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})],
              ].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                  <span style={{fontSize:10,color:C.textMut,fontFamily:F.sans}}>{k}</span>
                  <span style={{fontSize:10.5,color:C.textPri,fontFamily:F.sans,textAlign:"right",maxWidth:110,lineHeight:1.4}}>{v}</span>
                </div>
              ))}
            </div>

            <Label>Applicable Laws</Label>
            <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:15}}>
              {["Indian Contract Act, 1872","Arb. & Conc. Act, 1996","Specific Relief Act, 1963","Registration Act, 1908"].map(l=>(
                <span key={l} style={{fontSize:9,color:C.gold,background:`${C.gold}10`,border:`1px solid ${C.gold}22`,borderRadius:3,padding:"3px 7px",lineHeight:1.4}}>{l}</span>
              ))}
            </div>

            <Label>Review Checklist</Label>
            {CHECKLIST_ITEMS.map((item,i)=>{
              const checked = checklist.has(item);
              return (
                <div key={i} style={{display:"flex",alignItems:"center",gap:7,marginBottom:8,cursor:"pointer"}} onClick={()=>toggleChecklist(item)}>
                  <div style={{width:13,height:13,borderRadius:3,border:`1px solid ${checked?C.green:C.border}`,flexShrink:0,background:checked?`${C.green}30`:"transparent",transition:"all 0.15s"}}/>
                  <span style={{fontSize:10.5,color:checked?C.textPri:C.textSec,fontFamily:F.sans,lineHeight:1.4}}>{item}</span>
                </div>
              );
            })}
          </div>
          <div style={{padding:"10px 13px",borderTop:`1px solid ${C.border}`}}>
            <ReminderCard>Have a licensed advocate review before execution. Stamp duty varies by state.</ReminderCard>
          </div>
        </div>
      </div>
    </div>
  );
}
