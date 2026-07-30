"use client";

import { useState } from "react";
import { C, F } from "@/shared/constants/theme";
import { MATTERS, STATUS_C, TYPE_C } from "@/shared/constants/matters";

export default function MattersView() {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter]     = useState("ALL");
  const [search, setSearch]     = useState("");

  const filtered = MATTERS.filter(m=>{
    const matchFilter = filter==="ALL"||m.status.toUpperCase()===filter||(filter==="OPEN"&&m.status!=="closed");
    const matchSearch = !search.trim()||(m.label+m.code+m.type).toLowerCase().includes(search.toLowerCase());
    return matchFilter&&matchSearch;
  });
  const sel = selected ? MATTERS.find(m=>m.id===selected) : null;
  const stats = { total:MATTERS.length, active:MATTERS.filter(m=>m.status==="active").length, urgent:MATTERS.filter(m=>m.status==="urgent").length, closed:MATTERS.filter(m=>m.status==="closed").length };

  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div className="ast-view-header" style={{height:52,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 22px",background:C.bgPanel,flexShrink:0}}>
        <div className="ast-view-header-title" style={{display:"flex",alignItems:"center",gap:8,fontSize:12,minWidth:0}}><span style={{color:C.textPri}}>My Matters</span><span style={{color:C.textMut,marginLeft:4}}>— {MATTERS.length} total</span></div>
        <div className="ast-view-header-actions"><button style={{padding:"6px 14px",background:C.red,border:"none",borderRadius:6,color:"#fff",fontSize:11,cursor:"pointer",fontFamily:F.sans,fontWeight:500}}>+ New Matter</button></div>
      </div>

      <div className="ast-split-row" style={{flex:1,display:"flex",overflow:"hidden"}}>
        {/* list */}
        <div className="ast-split-list" style={{width:sel?300:"100%",borderRight:sel?`1px solid ${C.border}`:"none",display:"flex",flexDirection:"column",overflow:"hidden",transition:"width 0.2s"}}>
          {/* stats bar */}
          <div style={{display:"flex",gap:0,borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
            {[["ALL",stats.total,"All"],["OPEN",stats.active+stats.urgent,"Open"],["URGENT",stats.urgent,"Urgent"],["CLOSED",stats.closed,"Closed"]].map(([f,n,l])=>(
              <div key={f} onClick={()=>setFilter(f)} style={{flex:1,padding:"10px 8px",textAlign:"center",cursor:"pointer",borderBottom:`2px solid ${filter===f?C.red:"transparent"}`,transition:"all 0.15s",background:filter===f?C.redFaint:"transparent"}}>
                <div style={{fontSize:16,fontWeight:700,color:filter===f?C.red:C.textPri,fontFamily:F.serif}}>{n}</div>
                <div style={{fontSize:9,color:filter===f?C.red:C.textMut,letterSpacing:"0.08em",textTransform:"uppercase",marginTop:2}}>{l}</div>
              </div>
            ))}
          </div>
          {/* search */}
          <div style={{padding:"10px 14px",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:8,background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:6,padding:"7px 11px"}}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.textMut} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search matters…" style={{flex:1,background:"transparent",border:"none",outline:"none",fontSize:12,color:C.textPri,fontFamily:F.sans,fontWeight:300}}/>
            </div>
          </div>
          {/* list */}
          <div style={{flex:1,overflowY:"auto",padding:"8px 10px"}}>
            {filtered.length===0&&<div style={{textAlign:"center",color:C.textMut,fontSize:12,fontFamily:F.sans,padding:"32px 0"}}>No matters found.</div>}
            {filtered.map((m,i)=>{
              const isActive=selected===m.id;
              return(
                <div key={m.id} onClick={()=>setSelected(isActive?null:m.id)}
                  style={{background:isActive?C.redFaint:C.bgCard,border:`1px solid ${isActive?C.red:C.border}`,borderRadius:8,padding:"13px 14px",marginBottom:7,cursor:"pointer",transition:"all 0.15s",animation:`fadeUp 0.25s ease ${i*0.04}s both`}}
                  onMouseEnter={e=>{if(!isActive){e.currentTarget.style.borderColor=C.borderMid;}}} onMouseLeave={e=>{if(!isActive){e.currentTarget.style.borderColor=C.border;}}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:5}}>
                    <span style={{fontSize:9,color:C.textMut,fontFamily:"monospace"}}>{m.code}</span>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      {m.tasks>0&&<span style={{fontSize:9,color:C.amber,background:`${C.amber}18`,border:`1px solid ${C.amber}30`,borderRadius:3,padding:"1px 6px"}}>{m.tasks} tasks</span>}
                      <span style={{fontSize:9,color:STATUS_C[m.status]||C.textMut,background:`${STATUS_C[m.status]||C.textMut}18`,border:`1px solid ${STATUS_C[m.status]||C.textMut}30`,borderRadius:3,padding:"1px 6px",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em"}}>{m.status}</span>
                    </div>
                  </div>
                  <div style={{fontSize:13,fontWeight:500,color:C.textPri,fontFamily:F.sans,marginBottom:3,lineHeight:1.3}}>{m.label}</div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:10,color:TYPE_C[m.type]||C.textSec,background:`${TYPE_C[m.type]||C.textSec}15`,border:`1px solid ${TYPE_C[m.type]||C.textSec}25`,borderRadius:3,padding:"1px 6px"}}>{m.type}</span>
                    <span style={{fontSize:10,color:C.textMut,fontFamily:F.sans}}>{m.updated}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* detail panel */}
        {sel&&(
          <div className="ast-split-detail" style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",animation:"slideIn 0.2s ease"}}>
            <div style={{padding:"16px 22px",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12}}>
                <div>
                  <div style={{fontSize:10,color:C.textMut,fontFamily:"monospace",marginBottom:4}}>{sel.code}</div>
                  <div style={{fontFamily:F.serif,fontSize:20,fontWeight:600,color:C.textPri,lineHeight:1.25}}>{sel.label}</div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginTop:6}}>
                    <span style={{fontSize:10,color:TYPE_C[sel.type]||C.textSec,background:`${TYPE_C[sel.type]||C.textSec}15`,border:`1px solid ${TYPE_C[sel.type]||C.textSec}25`,borderRadius:3,padding:"2px 8px"}}>{sel.type}</span>
                    <span style={{fontSize:10,color:STATUS_C[sel.status]||C.textMut,background:`${STATUS_C[sel.status]||C.textMut}18`,border:`1px solid ${STATUS_C[sel.status]||C.textMut}30`,borderRadius:3,padding:"2px 8px",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em"}}>{sel.status}</span>
                  </div>
                </div>
                <button onClick={()=>setSelected(null)} style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:5,padding:"5px 7px",color:C.textMut,cursor:"pointer",fontSize:14,lineHeight:1}}>×</button>
              </div>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:"20px 22px"}}>
              <div style={{padding:"12px 14px",background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:8,marginBottom:16}}>
                <div style={{fontSize:9,color:C.textMut,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>Matter Overview</div>
                <p style={{fontSize:12.5,color:C.textPri,fontFamily:F.sans,fontWeight:300,lineHeight:1.7}}>{sel.desc}</p>
              </div>
              {sel.court!=="N/A"&&(
                <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:8,marginBottom:14}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M6 9L3 18h6L6 9z"/><path d="M18 9l-3 9h6l-3-9z"/></svg>
                  <div><div style={{fontSize:9,color:C.textMut,marginBottom:2}}>Forum</div><div style={{fontSize:12,color:C.textPri,fontFamily:F.sans}}>{sel.court}</div></div>
                </div>
              )}
              <div style={{fontSize:9,color:C.textMut,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10}}>Quick Actions</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
                {[
                  {icon:"🔍",label:"Research",desc:"Find case law"},
                  {icon:"📝",label:"Draft",desc:"Create document"},
                  {icon:"⚑",label:"Due Diligence",desc:"Analyse contract"},
                  {icon:"⚖",label:"Strategy",desc:"Litigation plan"},
                ].map(a=>(
                  <div key={a.label} style={{padding:"12px 13px",background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:7,cursor:"pointer",transition:"all 0.15s"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=C.red;e.currentTarget.style.background=C.redFaint;}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background=C.bgCard;}}>
                    <div style={{fontSize:16,marginBottom:4}}>{a.icon}</div>
                    <div style={{fontSize:11,fontWeight:500,color:C.textPri,fontFamily:F.sans}}>{a.label}</div>
                    <div style={{fontSize:10,color:C.textMut}}>{a.desc}</div>
                  </div>
                ))}
              </div>
              <div style={{fontSize:9,color:C.textMut,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10}}>Recent Activity</div>
              {[
                {action:"Research query run",time:"Today, 11:42 AM",icon:"🔍"},
                {action:"Document uploaded",time:"Yesterday, 4:15 PM",icon:"📎"},
                {action:"Matter opened",time:sel.updated,icon:"✦"},
              ].map((a,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:7,marginBottom:6}}>
                  <span style={{fontSize:13}}>{a.icon}</span>
                  <div style={{flex:1}}><div style={{fontSize:11.5,color:C.textPri,fontFamily:F.sans}}>{a.action}</div><div style={{fontSize:10,color:C.textMut,marginTop:1}}>{a.time}</div></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
