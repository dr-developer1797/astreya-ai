"use client";

import { useState, useEffect } from "react";
import { C, F } from "@/shared/constants/theme";
import Label from "@/shared/ui/Label";
import ExportModal from "@/shared/modals/ExportModal";
import { listDrafts, deleteDraft } from "@/shared/storage/drafts";

export default function HistoryView() {
  const [drafts,   setDrafts]   = useState(null);
  const [selected, setSelected] = useState(null);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("ALL");
  const [exportMod,setExportMod]= useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    (async () => {
      const loaded = await listDrafts();
      setDrafts(loaded);
      if (loaded.length > 0) setSelected(loaded[0].id);
    })();
  }, []);

  const handleDeleteDraft = async (id) => {
    setDeleting(id);
    try {
      await deleteDraft(id);
      const next = (drafts||[]).filter(d=>d.id!==id);
      setDrafts(next);
      if (selected===id) setSelected(next[0]?.id||null);
    } catch {}
    setDeleting(null);
  };

  const sel        = selected ? (drafts||[]).find(d=>d.id===selected) : null;
  const categories = [...new Set((drafts||[]).map(d=>d.category).filter(Boolean))];

  const filtered = (drafts||[]).filter(d=>{
    const matchF = filter==="ALL" || d.category===filter;
    const matchS = !search.trim() ||
      (d.typeLabel+d.category+(d.form?.party_a||"")+(d.form?.party_b||"")+(d.form?.employer||"")+(d.form?.employee||"")+(d.form?.provider||"")).toLowerCase().includes(search.toLowerCase());
    return matchF && matchS;
  });

  const fmt = iso => {
    if (!iso) return "—";
    const d   = new Date(iso);
    const now = new Date();
    const m   = Math.floor((now-d)/60000);
    if (m < 1)    return "Just now";
    if (m < 60)   return `${m}m ago`;
    if (m < 1440) return `${Math.floor(m/60)}h ago`;
    if (m < 2880) return "Yesterday";
    return d.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
  };

  const partyLine = d => {
    const f = d.form||{};
    if (f.party_a && f.party_b)  return `${f.party_a.split(",")[0]} ↔ ${f.party_b.split(",")[0]}`;
    if (f.employer && f.employee) return `${f.employer} · ${f.employee}`;
    if (f.provider && f.client)   return `${f.provider} → ${f.client}`;
    if (f.sender)                 return `From: ${f.sender.split(",")[0]}`;
    return "";
  };

  const CAT_C = { Corporate:C.blue, Commercial:C.gold, Labour:C.green, Property:C.amber, Litigation:C.red };

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {/* topbar */}
      <div className="ast-view-header" style={{height:52,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 22px",background:C.bgPanel,flexShrink:0}}>
        <div className="ast-view-header-title" style={{display:"flex",alignItems:"center",gap:8,fontSize:12,minWidth:0}}>
          <span style={{color:C.textPri}}>History</span>
          {drafts!==null && <span style={{color:C.textMut,marginLeft:2}}>— {drafts.length} draft{drafts.length!==1?"s":""}</span>}
        </div>
        <div className="ast-view-header-actions ast-hide-mobile" style={{display:"flex",alignItems:"center",gap:6,fontSize:9,color:C.textMut,fontFamily:F.sans}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:C.green}}/>
          Drafts saved automatically
        </div>
      </div>

      <div className="ast-split-row" style={{flex:1,display:"flex",overflow:"hidden"}}>

        {/* ── list ── */}
        <div className="ast-split-list" style={{width:sel?316:"100%",borderRight:sel?`1px solid ${C.border}`:"none",display:"flex",flexDirection:"column",overflow:"hidden",transition:"width 0.22s",flexShrink:0}}>

          <div style={{padding:"10px 12px",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:8,background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:6,padding:"7px 11px",marginBottom:8}}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.textMut} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search drafts…" style={{flex:1,background:"transparent",border:"none",outline:"none",fontSize:12,color:C.textPri,fontFamily:F.sans,fontWeight:300}}/>
              {search&&<span onClick={()=>setSearch("")} style={{fontSize:14,color:C.textMut,cursor:"pointer",lineHeight:1}}>×</span>}
            </div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {["ALL",...categories].map(cat=>(
                <span key={cat} onClick={()=>setFilter(cat)}
                  style={{fontSize:9,color:filter===cat?C.red:C.textMut,background:filter===cat?C.redFaint:"transparent",border:`1px solid ${filter===cat?C.red:C.border}`,borderRadius:3,padding:"2px 8px",cursor:"pointer",fontFamily:F.sans,letterSpacing:"0.05em",transition:"all 0.13s"}}>
                  {cat}
                </span>
              ))}
            </div>
          </div>

          <div style={{flex:1,overflowY:"auto",padding:"8px 10px"}}>
            {/* skeleton */}
            {drafts===null && [1,2,3,4].map(i=>(
              <div key={i} style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:8,padding:"13px 14px",marginBottom:7}}>
                <div style={{height:8,background:C.bgHover,borderRadius:3,marginBottom:8,width:"50%",animation:"shimmer 1.5s ease infinite"}}/>
                <div style={{height:7,background:C.bgHover,borderRadius:3,marginBottom:5,width:"80%",animation:"shimmer 1.5s ease infinite"}}/>
                <div style={{height:6,background:C.bgHover,borderRadius:3,width:"40%",animation:"shimmer 1.5s ease infinite"}}/>
              </div>
            ))}

            {/* empty */}
            {drafts!==null && drafts.length===0 && (
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:12,padding:"48px 24px",textAlign:"center"}}>
                <div style={{fontSize:40}}>📝</div>
                <div style={{fontFamily:F.serif,fontSize:19,fontWeight:600,color:C.textMut}}>No drafts yet</div>
                <p style={{fontSize:12,color:C.textMut,fontFamily:F.sans,fontWeight:300,lineHeight:1.65,maxWidth:270}}>Drafts generated in the Drafting module are saved here automatically. Generate your first draft to get started.</p>
              </div>
            )}

            {drafts!==null && drafts.length>0 && filtered.length===0 && (
              <div style={{padding:"28px 0",textAlign:"center",color:C.textMut,fontSize:12,fontFamily:F.sans}}>No drafts match your search.</div>
            )}

            {filtered.map((d,i)=>{
              const isActive = selected===d.id;
              const col      = CAT_C[d.category]||C.textSec;
              return (
                <div key={d.id} onClick={()=>setSelected(isActive?null:d.id)}
                  style={{background:isActive?C.redFaint:C.bgCard,border:`1px solid ${isActive?C.red:C.border}`,borderRadius:8,padding:"12px 13px",marginBottom:7,cursor:"pointer",transition:"all 0.15s",animation:`fadeUp 0.25s ease ${i*0.035}s both`}}
                  onMouseEnter={e=>{if(!isActive){e.currentTarget.style.borderColor=C.borderMid;e.currentTarget.style.background=C.bgHover;}}}
                  onMouseLeave={e=>{if(!isActive){e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background=C.bgCard;}}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <span style={{fontSize:15}}>{d.typeIcon||"📝"}</span>
                      <span style={{fontSize:9,color:col,background:`${col}18`,border:`1px solid ${col}28`,borderRadius:3,padding:"1px 6px",letterSpacing:"0.06em",fontFamily:F.sans}}>{d.category||"Draft"}</span>
                    </div>
                    <span style={{fontSize:9,color:C.textMut,fontFamily:F.sans}}>{fmt(d.createdAt)}</span>
                  </div>
                  <div style={{fontSize:12.5,fontWeight:500,color:C.textPri,fontFamily:F.sans,lineHeight:1.3,marginBottom:3}}>{d.typeLabel}</div>
                  {partyLine(d)&&<div style={{fontSize:10.5,color:C.textSec,fontFamily:F.sans,lineHeight:1.4,marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{partyLine(d)}</div>}
                  <div style={{display:"flex",alignItems:"center",gap:7}}>
                    <span style={{fontSize:9,color:C.textMut,fontFamily:F.sans}}>{(d.wordCount||0).toLocaleString()} words</span>
                    {d.form?.governing&&<><span style={{fontSize:8,color:C.textMut}}>·</span><span style={{fontSize:9,color:C.textMut,fontFamily:F.sans}}>{d.form.governing}</span></>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── detail panel ── */}
        {sel && (
          <div className="ast-split-detail" style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",animation:"slideIn 0.2s ease"}}>
            <div style={{padding:"12px 20px",borderBottom:`1px solid ${C.border}`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
              <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
                <span style={{fontSize:22,flexShrink:0}}>{sel.typeIcon||"📝"}</span>
                <div style={{minWidth:0}}>
                  <div style={{fontFamily:F.serif,fontSize:18,fontWeight:600,color:C.textPri,lineHeight:1.2}}>{sel.typeLabel}</div>
                  <div style={{fontSize:10,color:C.textMut,fontFamily:F.sans,marginTop:2}}>{fmt(sel.createdAt)} · {(sel.wordCount||0).toLocaleString()} words</div>
                </div>
              </div>
              <div style={{display:"flex",gap:6,flexShrink:0}}>
                <button onClick={()=>navigator.clipboard?.writeText(sel.content||"")} style={{padding:"5px 11px",background:"transparent",border:`1px solid ${C.border}`,borderRadius:5,color:C.textSec,fontSize:11,cursor:"pointer",fontFamily:F.sans}}>Copy</button>
                <button onClick={()=>setExportMod(true)} style={{padding:"5px 11px",background:"transparent",border:`1px solid ${C.border}`,borderRadius:5,color:C.textSec,fontSize:11,cursor:"pointer",fontFamily:F.sans}}>↓ Export Word</button>
                <button onClick={()=>{ if(window.confirm("Delete this draft? This cannot be undone.")) handleDeleteDraft(sel.id); }} disabled={deleting===sel.id}
                  style={{padding:"5px 11px",background:"transparent",border:`1px solid ${C.redGlow}`,borderRadius:5,color:C.red,fontSize:11,cursor:"pointer",fontFamily:F.sans,opacity:deleting===sel.id?0.5:1}}>
                  {deleting===sel.id?"…":"🗑 Delete"}
                </button>
              </div>
            </div>

            <div style={{flex:1,display:"flex",overflow:"hidden"}}>
              <div style={{flex:1,overflowY:"auto",padding:"20px 26px"}}>
                {/* form metadata chips */}
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
                  {Object.entries(sel.form||{}).filter(([k,v])=>v&&typeof v==="string"&&v.trim()&&k!=="notes").slice(0,6).map(([k,v])=>(
                    <div key={k} style={{padding:"4px 9px",background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:4}}>
                      <span style={{fontSize:8,color:C.textMut,textTransform:"uppercase",letterSpacing:"0.07em"}}>{k.replace(/_/g," ")} </span>
                      <span style={{fontSize:10,color:C.textPri,fontFamily:F.sans}}>{String(v).slice(0,38)}</span>
                    </div>
                  ))}
                </div>
                {/* document */}
                <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:9,padding:"26px 30px"}}>
                  <div style={{fontFamily:F.sans,fontSize:12.5,color:C.textPri,lineHeight:1.92,fontWeight:300,whiteSpace:"pre-wrap"}}>{sel.content||""}</div>
                </div>
                {/* instructions used */}
                {sel.notes?.trim()&&(
                  <div style={{marginTop:14,padding:"10px 13px",background:C.bgCard,border:`1px solid ${C.border}`,borderLeft:`2px solid ${C.blue}`,borderRadius:"0 6px 6px 0"}}>
                    <div style={{fontSize:9,color:C.blue,fontWeight:600,letterSpacing:"0.08em",marginBottom:4}}>INSTRUCTIONS USED</div>
                    <p style={{fontSize:11,color:C.textSec,fontFamily:F.sans,fontWeight:300,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{sel.notes}</p>
                  </div>
                )}
              </div>
              {/* meta sidebar */}
              <div className="ast-editor-side ast-panel-r-narrow" style={{width:196,borderLeft:`1px solid ${C.border}`,background:C.bgPanel,padding:"14px 12px",overflowY:"auto",flexShrink:0}}>
                <Label>Details</Label>
                {[["Type",sel.typeLabel],["Category",sel.category||"—"],["Governing",sel.form?.governing||"—"],["Words",(sel.wordCount||0).toLocaleString()],["Saved",new Date(sel.createdAt).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})]].map(([k,v])=>(
                  <div key={k} style={{marginBottom:9,padding:"7px 9px",background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:6}}>
                    <div style={{fontSize:8,color:C.textMut,marginBottom:2,textTransform:"uppercase",letterSpacing:"0.08em"}}>{k}</div>
                    <div style={{fontSize:10.5,color:C.textPri,fontFamily:F.sans,lineHeight:1.4}}>{v}</div>
                  </div>
                ))}
                <div style={{marginTop:4,padding:"8px 9px",background:`${C.amber}0E`,border:`1px solid ${C.amber}33`,borderRadius:6}}>
                  <div style={{fontSize:8,color:C.amber,fontWeight:600,letterSpacing:"0.08em",marginBottom:3}}>REMINDER</div>
                  <p style={{fontSize:9.5,color:C.textMut,lineHeight:1.5}}>Review with a qualified advocate before execution.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {exportMod&&sel&&(
        <ExportModal defaultName={`${sel.typeShort||"draft"}_astreya`} content={sel.content||""} title={sel.typeLabel||"Legal Document"} onClose={()=>setExportMod(false)}/>
      )}
    </div>
  );
}
