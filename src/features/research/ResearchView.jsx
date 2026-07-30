"use client";

import { useState, useRef, useCallback, useEffect, useContext } from "react";
import Image from "next/image";
import { C, F } from "@/shared/constants/theme";
import Btn from "@/shared/ui/Btn";
import Spinner from "@/shared/ui/Spinner";
import { ViewportContext } from "@/shared/hooks/useViewport";
import { streamChatCompletion } from "@/shared/llm/stream";
import { RESEARCH_SYSTEM, SAMPLE_Q } from "@/features/research/prompts";


export default function ResearchView() {
  const { isMobile } = useContext(ViewportContext);
  const [messages,  setMessages]  = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [streamText,setStreamText]= useState("");
  const [qval,      setQval]      = useState("");
  const [showSrc,   setShowSrc]   = useState(false);
  const [topic,     setTopic]     = useState("Legal Research");
  const [ikSources, setIkSources] = useState([]);
  const [ikLoading, setIkLoading] = useState(false);
  const [ikError,   setIkError]   = useState("");
  const [ikGrounded,setIkGrounded]= useState(null);   // null until the first query resolves
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!isMobile) setShowSrc(true);
  }, [isMobile]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, streamText]);

  const search = useCallback(async (query) => {
    if (!query.trim() || streaming) return;
    const q = query.trim();
    setQval(""); setTopic(q.length>40?q.slice(0,37)+"\u2026":q);
    setIkError("");
    const userMsg = { role:"user", content:q };
    const history = [...messages, userMsg];
    setMessages(history); setStreaming(true); setStreamText("");

    /* STEP 1 — IndianKanoon retrieval (statutes + Supreme Court + High Courts) */
    let ikDocs = [];
    setIkLoading(true); setIkSources([]);
    try {
      const ikRes = await fetch("/api/legal-search", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ query:q, page:0 }),
      });
      const ikJson = await ikRes.json().catch(()=>({}));
      if (!ikRes.ok) throw new Error(ikJson.error || `Search failed (${ikRes.status})`);

      ikDocs = Array.isArray(ikJson.sources) ? ikJson.sources.map((d,i)=>({...d, ref:i+1})) : [];
      setIkSources(ikDocs);
      setIkGrounded(ikDocs.length>0);
      if (ikJson.configured === false)  setIkError("Case-law search is not configured — answering from the model's own knowledge only.");
      else if (ikDocs.length === 0)     setIkError("No IndianKanoon match for this query — answering without retrieved authority.");
      else if (ikJson.degraded)         setIkError("Part of IndianKanoon did not respond — results may be incomplete.");
    } catch(err) {
      setIkError(`IndianKanoon unavailable (${err.message}) — answering without retrieved authority.`);
      setIkGrounded(false);
    }
    setIkLoading(false);

    /* STEP 2 — Build grounding context */
    const fmt = (d) => {
      const lines = [`[${d.ref}] ${d.title}`];
      // Only a real reporter citation is passed through; the model is told not to invent one.
      if (d.citation) lines.push(`    Reported at: ${d.citation}`);
      lines.push(`    Source: ${d.court||"N/A"} | Date: ${d.date||"N/A"} | Cited by ${d.citedBy} documents`);
      lines.push(`    URL: ${d.url}`);
      if (d.fullText)     lines.push(`    Verbatim extract: ${d.fullText}`);
      else if (d.snippet) lines.push(`    Matched passage: ${d.snippet}`);
      return lines.join("\n");
    };
    const statutes = ikDocs.filter(d=>d.kind==="statute");
    const rulings  = ikDocs.filter(d=>d.kind!=="statute");
    const ikContext = ikDocs.length>0
      ? "\n\n--- RETRIEVED SOURCES FROM INDIANKANOON ---\n"+
        [ statutes.length ? "STATUTORY PROVISIONS:\n"+statutes.map(fmt).join("\n\n") : "",
          rulings.length  ? "JUDGMENTS:\n"+rulings.map(fmt).join("\n\n")  : "",
        ].filter(Boolean).join("\n\n")+
        "\n--- END RETRIEVED SOURCES ---"
      : "";

    /* STEP 3 — Answer, grounded on the retrieved sources */
    const apiMessages = [
      ...history.slice(0,-1).map(m=>({role:m.role,content:m.content})),
      {role:"user", content:q+ikContext},
    ];
    try {
      const full = await streamChatCompletion({
        sys: RESEARCH_SYSTEM,
        messages: apiMessages,
        onToken: (text) => setStreamText(text),
      });
      setMessages(prev=>[...prev,{role:"assistant",content:full}]);
    } catch(err){
      setMessages(prev=>[...prev,{role:"assistant",content:`\u26a0 Error: ${err.message}`}]);
    }
    setStreamText(""); setStreaming(false);
  }, [messages, streaming]);

  const demo = () => {
    if(streaming)return;
    const dt="Yes. A High Court holds inherent power to quash an FIR under **Section 482, CrPC 1973** (now **Section 528, BNSS 2023**, effective July 1, 2024). This power is discretionary and must be exercised sparingly.\n\n**Governing Framework**\n- Section 482 CrPC / Section 528 BNSS 2023\n- Article 226, Constitution of India\n\n**Seven Bhajan Lal Grounds** [1992 Supp (1) SCC 335]\n\n01. Allegations do not constitute a cognisable offence at face value\n02. Allegations are manifestly absurd or inherently impossible\n03. Offence not cognisable — police had no authority\n04. Prosecution attended with mala fide intent\n05. Proceeding filed to wreak vengeance or settle scores\n06. Continuing would amount to abuse of process\n07. Legal bar against initiation or continuance\n\n**Key Precedents**\n- *State of Haryana v. Bhajan Lal* — 1992 Supp (1) SCC 335\n- *Neeharika Infrastructure v. State of Maharashtra* — (2021) 19 SCC 401\n- *Pepsi Foods Ltd. v. Special Judicial Magistrate* — (1998) 5 SCC 749\n\n\u26a0 Research output only — verify with primary sources and consult a qualified advocate.";
    setMessages([{role:"user",content:SAMPLE_Q},{role:"assistant",content:""}]);
    setTopic("Criminal Procedure"); setStreaming(true); setStreamText("");
    setIkError(""); setIkGrounded(true);
    setIkSources([
      {id:"1306176",kind:"statute", title:"Section 482 in The Code of Criminal Procedure, 1973",court:"Union of India - Section",date:"1974-01-25",citedBy:644872,url:"https://indiankanoon.org/doc/1306176/",ref:1,snippet:"Saving of inherent powers of High Court."},
      {id:"1501908",kind:"judgment",title:"State of Haryana v. Bhajan Lal",citation:"1992 Supp (1) SCC 335",court:"Supreme Court of India",date:"1992-11-21",citedBy:42800,url:"https://indiankanoon.org/doc/1501908/",ref:2,snippet:""},
      {id:"501105", kind:"judgment",title:"Neeharika Infrastructure v. State of Maharashtra",citation:"AIR 2021 SUPREME COURT 1918",court:"Supreme Court of India",date:"2021-04-13",citedBy:3990,url:"https://indiankanoon.org/doc/501105/",ref:3,snippet:""},
      {id:"1279834",kind:"judgment",title:"Pepsi Foods Ltd. v. Special Judicial Magistrate",citation:"(1998) 5 SCC 749",court:"Supreme Court of India",date:"1998-04-07",citedBy:8900,url:"https://indiankanoon.org/doc/1279834/",ref:4,snippet:""},
    ]);
    let i=0; let acc="";
    const tick=()=>{
      if(i>=dt.length){setMessages([{role:"user",content:SAMPLE_Q},{role:"assistant",content:dt}]);setStreamText("");setStreaming(false);return;}
      acc+=dt[i++]; setStreamText(acc);
      setMessages(prev=>{const n=[...prev];n[n.length-1]={role:"assistant",content:acc};return n;});
      setTimeout(tick,10);
    };
    setTimeout(tick,300);
  };

  const handleKey = e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();search(qval);}};

  const renderMd = (text) => text.split("\n").map((line,i)=>{
    const bold=s=>{const ps=s.split(/(\*\*[^*]+\*\*)/g);return ps.map((p,j)=>p.startsWith("**")?<strong key={j} style={{color:C.textPri,fontWeight:600}}>{p.slice(2,-2)}</strong>:p);};
    const it=s=>{const ps=s.split(/(\*[^*]+\*)/g);return ps.map((p,j)=>p.startsWith("*")&&!p.startsWith("**")?<em key={j} style={{fontStyle:"italic"}}>{p.slice(1,-1)}</em>:bold(p));};
    if(/^\d{2}\.\ /.test(line)){const m=line.match(/^(\d{2})\.\s(.*)/);return <div key={i} style={{display:"flex",gap:9,marginBottom:6}}><span style={{color:C.red,fontWeight:700,fontFamily:"monospace",fontSize:11,minWidth:22,flexShrink:0,marginTop:2}}>{m[1]}.</span><span style={{fontSize:13,color:C.textPri,lineHeight:1.7,fontFamily:F.sans,fontWeight:300}}>{it(m[2])}</span></div>;}
    // Hash headings and pipe tables are both common in the model's output; without these two
    // branches they reach the reader as literal "###" and "| :--- |" syntax.
    if(/^#{1,6}\s/.test(line)){
      const m=line.match(/^(#{1,6})\s+(.*)/); const top=m[1].length<=2;
      return <div key={i} style={{fontSize:top?14:10,fontWeight:top?600:700,letterSpacing:top?"0.01em":"0.1em",textTransform:top?"none":"uppercase",color:top?C.textPri:C.textSec,marginTop:i>0?18:0,marginBottom:8,borderBottom:`1px solid ${C.border}`,paddingBottom:7,fontFamily:top?F.serif:F.sans}}>{it(m[2])}</div>;
    }
    if(/^\s*\|.*\|?\s*$/.test(line)&&line.includes("|")){
      const cells=line.trim().replace(/^\||\|$/g,"").split("|").map(c=>c.trim());
      if(cells.every(c=>/^:?-{2,}:?$/.test(c)))return null;
      return <div key={i} style={{display:"flex",gap:10,padding:"6px 0",borderBottom:`1px solid ${C.border}`}}>
        {cells.map((c,j)=><div key={j} style={{flex:j===0?"0 0 36%":1,fontSize:12,color:j===0?C.textPri:C.textSec,fontFamily:F.sans,fontWeight:j===0?500:300,lineHeight:1.6}}>{it(c)}</div>)}
      </div>;
    }
    if(line.startsWith("**")&&line.endsWith("**"))return <div key={i} style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:C.textSec,marginBottom:8,marginTop:i>0?18:0,borderBottom:`1px solid ${C.border}`,paddingBottom:7,fontFamily:F.sans}}>{line.slice(2,-2)}</div>;
    if(line.startsWith("- "))return <div key={i} style={{display:"flex",gap:8,marginBottom:5}}><span style={{color:C.red,fontSize:11,marginTop:3,flexShrink:0}}>▸</span><span style={{fontSize:13,color:C.textPri,lineHeight:1.7,fontFamily:F.sans,fontWeight:300}}>{it(line.slice(2))}</span></div>;
    if(line.startsWith("\u26a0"))return <div key={i} style={{marginTop:14,padding:"9px 13px",background:`${C.amber}0E`,border:`1px solid ${C.amber}33`,borderRadius:6,fontSize:11,color:C.amber,fontFamily:F.sans,lineHeight:1.55}}>{line}</div>;
    if(line.trim()==="")return <div key={i} style={{height:5}}/>;
    return <p key={i} style={{fontSize:13,color:C.textPri,lineHeight:1.8,marginBottom:4,fontFamily:F.sans,fontWeight:300}}>{it(line)}</p>;
  });

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div className="ast-view-header" style={{height:52,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 22px",background:C.bgPanel,flexShrink:0}}>
        <div className="ast-view-header-title" style={{display:"flex",alignItems:"center",gap:8,fontSize:12,minWidth:0}}>
          <span style={{color:C.textSec}}>Research</span><span style={{color:C.textMut}}>›</span>
          <span style={{color:C.textPri,maxWidth:240,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{topic}</span>
          {(streaming||ikLoading)&&<div style={{display:"flex",alignItems:"center",gap:5,marginLeft:4}}><div style={{width:5,height:5,borderRadius:"50%",background:ikLoading?C.gold:C.red,animation:"pulse 1s infinite"}}/><span style={{fontSize:9,color:ikLoading?C.gold:C.red,letterSpacing:"0.08em"}}>{ikLoading?"FETCHING CASES\u2026":"GENERATING\u2026"}</span></div>}
        </div>
        <div className="ast-view-header-actions" style={{display:"flex",gap:7,alignItems:"center"}}>
          {/* Reflects the actual state of retrieval, so the badge never implies grounding that failed. */}
          {(()=>{ const ok=ikGrounded!==false, tone=ok?C.gold:C.amber;
            return (
              <div style={{display:"flex",alignItems:"center",gap:5,padding:"3px 9px",background:`${tone}12`,border:`1px solid ${tone}33`,borderRadius:4}} title={ikError||"Answers grounded on live IndianKanoon sources"}>
                <div style={{width:5,height:5,borderRadius:"50%",background:ikGrounded===null?C.textMut:ok?C.green:C.amber}}/>
                <span style={{fontSize:9,color:tone,letterSpacing:"0.07em",fontFamily:F.sans}}>{ok?"IndianKanoon Live":"Ungrounded"}</span>
              </div>
            ); })()}
          <Btn onClick={demo} className="ast-hide-mobile">↻ Demo Mode</Btn>
          <Btn onClick={()=>setShowSrc(s=>!s)} style={showSrc?{borderColor:C.red,color:C.red,background:C.redFaint}:{}}>
            {showSrc?"Hide Sources":"Sources"}{ikSources.length>0?` (${ikSources.length})`:""}
          </Btn>
        </div>
      </div>

      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div ref={scrollRef} className="ast-content-pad" style={{flex:1,overflowY:"auto",padding:"24px 28px"}}>
            {messages.length===0&&(
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:14}}>
                <div style={{width:48,height:48,background:C.redFaint,border:`1px solid ${C.redGlow}`,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <Image src="/astreya-logo-light.png" alt="" width={635} height={520} style={{width:26,height:21,objectFit:"contain"}}/>
                </div>
                <div style={{fontFamily:F.serif,fontSize:20,fontWeight:600,color:C.textPri}}>Ask Astreya anything</div>
                <p style={{fontSize:12,color:C.textSec,fontFamily:F.sans,fontWeight:300,textAlign:"center",maxWidth:380,lineHeight:1.6}}>Powered by IndianKanoon — answers drawn from real Indian case law and statutes.</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:7,justifyContent:"center",maxWidth:480,marginTop:4}}>
                  {["Can FIR be quashed under S.482 CrPC?","Rights of accused under BNSS 2023","Cheque bounce procedure S.138 NI Act","Bail under NDPS Act","Director liability under IBC 2016","DPDP Act 2023 obligations"].map(s=>(
                    <span key={s} onClick={()=>search(s)} style={{fontSize:11,color:C.textSec,background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:5,padding:"5px 11px",cursor:"pointer",fontFamily:F.sans,transition:"all 0.14s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=C.red;e.currentTarget.style.color=C.red;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.textSec;}}>{s}</span>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg,mi)=>(
              <div key={mi} style={{marginBottom:20,animation:"fadeUp 0.3s ease"}}>
                {msg.role==="user"?(
                  <div style={{display:"flex",justifyContent:"flex-end"}}>
                    <div style={{maxWidth:"72%",background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:"10px 10px 2px 10px",padding:"11px 15px"}} className="ast-user-bubble">
                      <div style={{fontSize:9,color:C.textMut,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:5}}>Query</div>
                      <p style={{fontSize:13,color:C.textPri,lineHeight:1.6,fontFamily:F.sans,fontWeight:300}}>{msg.content}</p>
                    </div>
                  </div>
                ):(
                  <div style={{display:"flex",gap:12}}>
                    <Image src="/astreya-logo-dark.png" alt="" width={631} height={521}
                      style={{width:26,height:21,objectFit:"contain",flexShrink:0,marginTop:5}}/>
                    <div style={{flex:1,maxWidth:680}} className="ast-answer-col">
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                        <span style={{fontSize:12,color:C.textPri,fontWeight:600}}>Astreya</span>
                        <span style={{fontSize:9,color:C.textMut,letterSpacing:"0.08em"}}>INDIAN LAW RESEARCH</span>
                        {mi===messages.length-1&&streaming&&[0,1,2].map(i=><div key={i} style={{width:4,height:4,borderRadius:"50%",background:C.red,animation:`shimmer 1.2s ease ${i*0.2}s infinite`}}/>)}
                      </div>
                      <div style={{fontFamily:F.sans}}>{renderMd(mi===messages.length-1&&streaming?streamText:msg.content)}</div>
                      {msg.role==="assistant"&&msg.content&&mi===messages.length-1&&!streaming&&(
                        <div style={{display:"flex",gap:5,marginTop:12,paddingTop:11,borderTop:`1px solid ${C.border}`}}>
                          {["Copy","Save to Matter"].map(l=><Btn key={l} onClick={()=>l==="Copy"&&navigator.clipboard?.writeText(msg.content)}>{l}</Btn>)}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {streaming&&messages[messages.length-1]?.role==="user"&&(
              <div style={{display:"flex",gap:12,marginBottom:20}}>
                <Image src="/astreya-logo-dark.png" alt="" width={631} height={521}
                  style={{width:26,height:21,objectFit:"contain",flexShrink:0,marginTop:3}}/>
                <div style={{flex:1,maxWidth:680}} className="ast-answer-col">
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                    <span style={{fontSize:12,color:C.textPri,fontWeight:600}}>Astreya</span>
                    {[0,1,2].map(i=><div key={i} style={{width:4,height:4,borderRadius:"50%",background:C.red,animation:`shimmer 1.2s ease ${i*0.2}s infinite`}}/>)}
                  </div>
                  {streamText?renderMd(streamText):<div style={{display:"flex",gap:6,alignItems:"center"}}><Spinner/><span style={{fontSize:11,color:C.textMut,fontFamily:F.sans}}>{ikLoading?"Searching IndianKanoon\u2026":"Analysing\u2026"}</span></div>}
                </div>
              </div>
            )}
          </div>
          <div className="ast-input-bar" style={{padding:"13px 22px",borderTop:`1px solid ${C.border}`,background:C.bgPanel,flexShrink:0}}>
            <div className="ast-input-row" style={{display:"flex",gap:9,alignItems:"center"}}>
              <div style={{flex:1,background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 13px",display:"flex",alignItems:"center",gap:9,minWidth:0}} onFocusCapture={e=>e.currentTarget.style.borderColor=C.borderMid} onBlurCapture={e=>e.currentTarget.style.borderColor=C.border}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.textMut} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input value={qval} onChange={e=>setQval(e.target.value)} onKeyDown={handleKey} placeholder="Ask a legal question…" style={{flex:1,background:"transparent",border:"none",outline:"none",fontSize:12.5,color:C.textPri,fontFamily:F.sans,fontWeight:300,minWidth:0}} disabled={streaming}/>
                <div className="ast-input-tags" style={{display:"flex",gap:5}}>{["CrPC","BNS","IBC","DPDP"].map(t=><span key={t} onClick={()=>!streaming&&setQval(v=>v+" "+t)} style={{fontSize:9,color:C.textMut,background:C.bgHover,border:`1px solid ${C.border}`,borderRadius:3,padding:"2px 6px",cursor:streaming?"not-allowed":"pointer"}}>{t}</span>)}</div>
              </div>
              <Btn primary onClick={()=>search(qval)} style={{opacity:streaming?0.5:1,cursor:streaming?"not-allowed":"pointer"}}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                Search
              </Btn>
            </div>
            {messages.length>0&&<div style={{marginTop:6}}><span onClick={()=>{setMessages([]);setIkSources([]);setTopic("Legal Research");setIkError("");setIkGrounded(null);}} style={{fontSize:10,color:C.textMut,cursor:"pointer",fontFamily:F.sans}} onMouseEnter={e=>e.target.style.color=C.textSec} onMouseLeave={e=>e.target.style.color=C.textMut}>✕ Clear conversation</span></div>}
          </div>
        </div>

        {showSrc&&(
          <>
            {isMobile&&<div className="ast-panel-overlay-backdrop" onClick={()=>setShowSrc(false)} aria-hidden="true"/>}
            <div className={`ast-panel-r${isMobile?"":" ast-panel-r-narrow"}`} style={{width:272,borderLeft:`1px solid ${C.border}`,background:C.bgPanel,display:"flex",flexDirection:"column",overflow:"hidden",animation:"slideIn 0.22s ease"}}>
            <div style={{padding:"13px 14px",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
                <div style={{fontSize:9,color:C.textMut,letterSpacing:"0.13em",textTransform:"uppercase"}}>IndianKanoon Results</div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  {ikLoading&&<Spinner/>}
                  {ikSources.length>0&&<span style={{fontSize:10,color:C.gold,fontWeight:600}}>{ikSources.length}</span>}
                  {isMobile&&<button type="button" onClick={()=>setShowSrc(false)} aria-label="Close sources" style={{background:"transparent",border:"none",color:C.textMut,cursor:"pointer",fontSize:18,lineHeight:1,padding:"0 4px"}}>×</button>}
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:5,padding:"4px 8px",background:`${C.gold}0A`,border:`1px solid ${C.gold}22`,borderRadius:4}}>
                <div style={{width:5,height:5,borderRadius:"50%",background:ikSources.length>0?C.green:C.textMut}}/>
                <span style={{fontSize:9,color:C.gold,fontFamily:F.sans,letterSpacing:"0.06em"}}>
                  {ikSources.length>0?(()=>{const st=ikSources.filter(s=>s.kind==="statute").length, ju=ikSources.length-st;
                    return [st?`${st} statute${st>1?"s":""}`:"", ju?`${ju} judgment${ju>1?"s":""}`:""].filter(Boolean).join(" · ");})():"Awaiting query"}
                </span>
              </div>
              {ikError&&(
                <div style={{marginTop:6,padding:"6px 8px",background:`${C.amber}0E`,border:`1px solid ${C.amber}33`,borderRadius:4,fontSize:9.5,color:C.amber,fontFamily:F.sans,lineHeight:1.5}}>{ikError}</div>
              )}
            </div>
            <div style={{flex:1,overflowY:"auto",padding:"9px 11px"}}>
              {ikLoading&&[1,2,3].map(i=>(
                <div key={i} style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:7,padding:"12px",marginBottom:7}}>
                  <div style={{height:8,background:C.bgHover,borderRadius:3,marginBottom:6,width:"60%",animation:"shimmer 1.5s ease infinite"}}/>
                  <div style={{height:7,background:C.bgHover,borderRadius:3,marginBottom:4,width:"90%",animation:"shimmer 1.5s ease infinite"}}/>
                  <div style={{height:7,background:C.bgHover,borderRadius:3,width:"70%",animation:"shimmer 1.5s ease infinite"}}/>
                </div>
              ))}
              {!ikLoading&&ikSources.length===0&&<div style={{padding:"20px 8px",textAlign:"center",color:C.textMut,fontSize:11,fontFamily:F.sans,lineHeight:1.6}}>Real IndianKanoon results appear here after your first query.</div>}
              {!ikLoading&&ikSources.map((src,i)=>(
                <div key={src.id} style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:8,padding:"11px 12px",marginBottom:7,cursor:"pointer",transition:"border-color 0.15s",animation:`slideIn 0.28s ease ${i*0.06}s both`}}
                  onClick={()=>window.open(src.url,"_blank","noopener")}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=C.gold}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                    <div style={{display:"flex",alignItems:"center",gap:5}}>
                      <span style={{fontSize:9,color:C.textMut,fontFamily:"monospace"}}>#{src.ref}</span>
                      <span style={{fontSize:8,color:src.kind==="statute"?C.blue:C.textSec,background:src.kind==="statute"?`${C.blue}18`:C.bgHover,border:`1px solid ${src.kind==="statute"?`${C.blue}30`:C.border}`,borderRadius:3,padding:"1px 5px",letterSpacing:"0.05em"}}>{src.kind==="statute"?"STATUTE":"JUDGMENT"}</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:5}}>
                      {/* Cited-by counts inbound references, which is what indicates authority. */}
                      {src.citedBy>0&&<span style={{fontSize:9,color:C.textMut}} title={`Cited by ${src.citedBy.toLocaleString()} documents`}>🔗 {src.citedBy.toLocaleString()}</span>}
                      <span style={{fontSize:8,color:C.gold,background:`${C.gold}18`,border:`1px solid ${C.gold}30`,borderRadius:3,padding:"1px 5px"}}>IK</span>
                    </div>
                  </div>
                  <div style={{fontSize:11.5,color:C.textPri,fontFamily:F.sans,fontWeight:500,lineHeight:1.35,marginBottom:4}}>{src.title}</div>
                  {src.citation&&<div style={{fontSize:10,color:C.gold,fontFamily:"monospace",marginBottom:4,fontStyle:"italic"}}>{src.citation}</div>}
                  <div style={{display:"flex",justifyContent:"space-between",gap:8,marginBottom:src.snippet?5:0}}>
                    <span style={{fontSize:9,color:C.textSec,fontFamily:F.sans}}>{src.court}</span>
                    <span style={{fontSize:9,color:C.textMut,flexShrink:0}}>{src.date}</span>
                  </div>
                  {src.snippet&&<div style={{fontSize:10.5,color:C.textMut,fontFamily:F.sans,lineHeight:1.5,borderTop:`1px solid ${C.border}`,paddingTop:5,marginTop:4}}>{src.snippet.slice(0,180)}</div>}
                  <div style={{marginTop:6,fontSize:9,color:C.gold,fontFamily:F.sans}}>Open on IndianKanoon ↗</div>
                </div>
              ))}
            </div>
            {ikSources.length>0&&(
              <div style={{padding:"9px 11px",borderTop:`1px solid ${C.border}`,flexShrink:0}}>
                <div style={{fontSize:9,color:C.textMut,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:7}}>Most Cited</div>
                {[...ikSources].sort((a,b)=>b.citedBy-a.citedBy).slice(0,3).map((src,i)=>(
                  <div key={src.id} onClick={()=>window.open(src.url,"_blank","noopener")} style={{display:"flex",alignItems:"center",gap:7,marginBottom:6,cursor:"pointer"}}>
                    <div style={{width:18,height:18,borderRadius:3,background:C.bgCard,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:C.gold,flexShrink:0}}>{i+1}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:10,color:C.textPri,fontFamily:F.sans,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{src.title}</div>
                      <div style={{fontSize:9,color:C.textMut}}>cited by {src.citedBy.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{padding:"8px 11px",borderTop:`1px solid ${C.border}`,flexShrink:0}}>
              <div style={{padding:"7px 9px",background:`${C.amber}0E`,border:`1px solid ${C.amber}28`,borderRadius:5}}>
                <div style={{fontSize:9,color:C.amber,fontWeight:600,letterSpacing:"0.08em",marginBottom:2}}>LAW TRANSITION</div>
                <p style={{fontSize:9.5,color:C.textMut,lineHeight:1.5}}>CrPC §482 → BNSS §528 from July 1, 2024.</p>
              </div>
            </div>
          </div>
          </>
        )}
      </div>
    </div>
  );
}
