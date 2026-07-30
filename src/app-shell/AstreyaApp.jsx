"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { C, F } from "@/shared/constants/theme";
import { FONT_IMPORT } from "@/shared/styles/fontImport";
import { NAV } from "@/shared/constants/nav";
import { MATTERS } from "@/shared/constants/matters";
import { useViewport, ViewportContext } from "@/shared/hooks/useViewport";
import DemoDisclaimerMarquee from "@/shared/ui/DemoDisclaimerMarquee";
import ResearchView from "@/features/research/ResearchView";
import DraftingView from "@/features/drafting/DraftingView";
import RiskReviewView from "@/features/due-diligence/RiskReviewView";
import LitigationView from "@/features/litigation/LitigationView";
import ComplianceView from "@/features/compliance/ComplianceView";
import HistoryView from "@/features/history/HistoryView";
import MattersView from "@/features/matters/MattersView";

export default function AstreyaApp() {
  const viewport = useViewport();
  const { isMobile, isTablet } = viewport;
  const [nav, setNav]           = useState("research");
  const [matter, setMatter]     = useState("m1");
  const [mOpen, setMOpen]       = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const m = MATTERS.find(x=>x.id===matter);

  const goNav = useCallback((id) => {
    setNav(id);
    setMenuOpen(false);
  }, []);

  const MOBILE_TABS = [
    { id: "research", label: "Research" },
    { id: "draft", label: "Draft" },
    { id: "review", label: "Review" },
    { id: "history", label: "History" },
    { id: "matters", label: "Matters" },
  ];

  const currentLabel = NAV.find(x => x.id === nav)?.label || "Astreya";

  const NavIcon = ({id}) => {
    const icons = {
      research:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
      draft:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
      review:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
      litigate:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M6 9L3 18h6L6 9z"/><path d="M18 9l-3 9h6l-3-9z"/></svg>,
      comply:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
      history: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
      matters: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
    };
    return icons[id] || null;
  };

  const sideW   = (isMobile || collapsed) ? (isMobile ? 0 : 52) : (isTablet ? 188 : 232);
  const sideTransition = "width 0.22s cubic-bezier(0.4,0,0.2,1)";

  return (
    <ViewportContext.Provider value={viewport}>
    <div className="ast-root" style={{fontFamily:F.sans,background:C.bg,height:"100vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <style>{FONT_IMPORT}</style>
      <DemoDisclaimerMarquee />

      <div
        className={`ast-backdrop${menuOpen ? " ast-visible" : ""}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden={!menuOpen}
      />

      <div className="ast-shell" style={{flex:1,display:"flex",overflow:"hidden",minHeight:0}}>

      {/* ── SIDEBAR ── */}
      <div
        className={`ast-sidebar${menuOpen ? " ast-open" : ""}${!collapsed && !isMobile ? " ast-sidebar-expanded" : ""}`}
        style={{width:sideW,minWidth:isMobile?0:sideW,background:C.bgPanel,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",flexShrink:0,overflow:"hidden",transition:sideTransition}}
      >

        {/* logo row */}
        <div style={{padding:collapsed?"11px 0":"19px 19px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:collapsed?"center":"space-between",gap:10,flexShrink:0}}>
          <div title={collapsed?"Expand":undefined} style={{display:"flex",alignItems:"center",gap:10,overflow:"hidden",cursor:collapsed?"pointer":"default",minWidth:0}} onClick={()=>{ if(collapsed) setCollapsed(false); }}>
            <Image src="/astreya-logo-dark.png" alt="Astreya" width={631} height={521} priority
              style={{width:29,height:24,objectFit:"contain",flexShrink:0}}/>
            {!collapsed && !isMobile && (
              <div style={{animation:"fadeUp 0.18s ease",minWidth:0}}>
                <div style={{fontFamily:F.serif,fontSize:20,fontWeight:700,color:C.textPri,letterSpacing:"0.18em",textTransform:"uppercase",whiteSpace:"nowrap"}}>Astreya</div>
                <div style={{fontSize:8,color:C.textMut,letterSpacing:"0.22em",textTransform:"uppercase",marginTop:-2,fontFamily:F.sans,whiteSpace:"nowrap"}}>Indian Legal AI</div>
              </div>
            )}
            {isMobile && (
              <div style={{animation:"fadeUp 0.18s ease",minWidth:0}}>
                <div style={{fontFamily:F.serif,fontSize:20,fontWeight:700,color:C.textPri,letterSpacing:"0.18em",textTransform:"uppercase",whiteSpace:"nowrap"}}>Astreya</div>
                <div style={{fontSize:8,color:C.textMut,letterSpacing:"0.22em",textTransform:"uppercase",marginTop:-2,fontFamily:F.sans,whiteSpace:"nowrap"}}>Indian Legal AI</div>
              </div>
            )}
          </div>
          {!collapsed && !isMobile && (
            <button onClick={()=>setCollapsed(true)} title="Collapse"
              style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:5,padding:"4px 5px",cursor:"pointer",color:C.textMut,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.15s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=C.borderMid;e.currentTarget.style.color=C.textPri;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.textMut;}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
          )}
          {isMobile && (
            <button type="button" onClick={()=>setMenuOpen(false)} aria-label="Close menu"
              style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:5,padding:"4px 8px",cursor:"pointer",color:C.textMut,fontSize:18,lineHeight:1,flexShrink:0}}>
              ×
            </button>
          )}
        </div>

        {/* matter picker */}
        {(!collapsed || isMobile) && (
          <div style={{padding:"10px 12px",borderBottom:`1px solid ${C.border}`,animation:"fadeUp 0.18s ease",flexShrink:0}}>
            <div style={{fontSize:9,color:C.textMut,letterSpacing:"0.13em",textTransform:"uppercase",marginBottom:6}}>Active Matter</div>
            <div onClick={()=>setMOpen(o=>!o)} style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 10px",cursor:"pointer"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{overflow:"hidden"}}>
                  <div style={{fontSize:10,color:C.red,fontWeight:600,letterSpacing:"0.05em",whiteSpace:"nowrap"}}>{m.code}</div>
                  <div style={{fontSize:11,color:C.textPri,marginTop:1,lineHeight:1.3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:140}}>{m.label}</div>
                </div>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.textMut} strokeWidth="2" strokeLinecap="round" style={{transform:mOpen?"rotate(180deg)":"none",transition:"transform 0.2s",flexShrink:0}}><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>
            {mOpen&&(
              <div style={{marginTop:3,background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:6,overflow:"hidden",animation:"fadeUp 0.15s ease"}}>
                {MATTERS.map(x=>(
                  <div key={x.id} onClick={()=>{setMatter(x.id);setMOpen(false);}}
                    style={{padding:"8px 11px",cursor:"pointer",borderBottom:`1px solid ${C.border}`,background:x.id===matter?C.redFaint:"transparent",transition:"background 0.1s"}}
                    onMouseEnter={e=>{if(x.id!==matter)e.currentTarget.style.background=C.bgHover;}}
                    onMouseLeave={e=>{if(x.id!==matter)e.currentTarget.style.background="transparent";}}>
                    <div style={{fontSize:9,color:x.id===matter?C.red:C.textMut,fontWeight:600,letterSpacing:"0.08em"}}>{x.code}</div>
                    <div style={{fontSize:11,color:C.textPri,marginTop:1}}>{x.label}</div>
                    <div style={{fontSize:9,color:C.textMut,marginTop:1}}>{x.type}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* nav */}
        <nav style={{flex:1,padding:collapsed?"6px 6px":"7px 8px",overflowY:"auto"}}>
          {NAV.map(item=>{
            const active=nav===item.id;
            return (
              <div key={item.id}
                onClick={()=>{ goNav(item.id); if(collapsed && !isMobile) setCollapsed(false); }}
                title={collapsed && !isMobile ? item.label : undefined}
                style={{display:"flex",alignItems:"center",gap:(collapsed && !isMobile)?0:9,padding:(collapsed && !isMobile)?"10px 0":"9px 10px",justifyContent:(collapsed && !isMobile)?"center":"flex-start",borderRadius:7,marginBottom:2,cursor:"pointer",background:active?C.redFaint:"transparent",border:`1px solid ${active?C.redGlow:"transparent"}`,color:active?C.red:C.textSec,transition:"all 0.15s"}}
                onMouseEnter={e=>{if(!active)e.currentTarget.style.background=C.bgHover;}}
                onMouseLeave={e=>{if(!active)e.currentTarget.style.background="transparent";}}>
                <div style={{flexShrink:0}}><NavIcon id={item.id}/></div>
                {!collapsed || isMobile ? <span style={{fontSize:12,fontWeight:active?500:400,whiteSpace:"nowrap",animation:"fadeUp 0.15s ease"}}>{item.label}</span> : null}
                {(!collapsed || isMobile) && active && <div style={{marginLeft:"auto",width:4,height:4,borderRadius:"50%",background:C.red,flexShrink:0}}/>}
              </div>
            );
          })}
        </nav>

        {/* user */}
        <div style={{padding:(collapsed && !isMobile)?"10px 0":"12px 13px",borderTop:`1px solid ${C.border}`,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:(collapsed && !isMobile)?0:8,justifyContent:(collapsed && !isMobile)?"center":"flex-start"}}>
            <div style={{width:26,height:26,borderRadius:"50%",background:"#1E2030",border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:C.textSec,fontWeight:600,flexShrink:0}}>HG</div>
            {(!collapsed || isMobile) && (
              <div style={{animation:"fadeUp 0.18s ease",overflow:"hidden"}}>
                <div style={{fontSize:11,color:C.textPri,fontWeight:500,whiteSpace:"nowrap"}}>Harold Gunderson</div>
                <div style={{fontSize:9,color:C.textMut,whiteSpace:"nowrap"}}>Senior Associate</div>
              </div>
            )}
          </div>
          {(!collapsed || isMobile) && (
            <div
              title="Gemma 4 served securely through Google AI Studio"
              style={{ display:"flex", alignItems:"center", gap:5, marginTop:7,
                padding:"4px 7px", background:C.bgHover, borderRadius:4, border:`1px solid ${C.border}` }}
            >
              <div style={{ width:5, height:5, borderRadius:"50%", background:C.green }} />
              <span style={{ fontSize:9, color:C.textMut, fontFamily:F.sans, letterSpacing:"0.08em" }}>
                AI STUDIO · GEMMA 4
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN ── */}
      <div className="ast-main-stack" style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",position:"relative",minWidth:0}}>
        <div className="ast-mobile-top">
          <button type="button" className="ast-mobile-menu-btn" onClick={()=>setMenuOpen(true)} aria-label="Open menu">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <div style={{minWidth:0,flex:1}}>
            <div style={{fontFamily:F.serif,fontSize:15,fontWeight:600,color:C.textPri,lineHeight:1.2}}>{currentLabel}</div>
            <div style={{fontSize:9,color:C.textMut,letterSpacing:"0.08em",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m?.code} · {m?.label}</div>
          </div>
        </div>

        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minHeight:0}}>
          {nav==="research" && <ResearchView/>}
          {nav==="draft"    && <DraftingView/>}
          {nav==="review"   && <RiskReviewView/>}
          {nav==="litigate" && <LitigationView/>}
          {nav==="comply"   && <ComplianceView/>}
          {nav==="history"  && <HistoryView/>}
          {nav==="matters"  && <MattersView/>}
        </div>

        <nav className="ast-bottom-nav" aria-label="Primary">
          {MOBILE_TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              className={`ast-bottom-nav-item${nav === tab.id ? " ast-active" : ""}`}
              onClick={() => goNav(tab.id)}
            >
              <NavIcon id={tab.id}/>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      </div>
    </div>
    </ViewportContext.Provider>
  );
}
