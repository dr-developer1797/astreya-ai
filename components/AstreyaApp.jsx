"use client";

import { useState, useRef, useCallback, useEffect, useMemo, createContext, useContext } from "react";
import Image from "next/image";

const MOBILE_MAX = 767;
const TABLET_MAX = 1023;

const ViewportContext = createContext({
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  isCompact: false,
});

function useViewport() {
  const [vp, setVp] = useState({ isMobile: false, isTablet: false, isDesktop: true, isCompact: false });

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      const isMobile = w <= MOBILE_MAX;
      const isTablet = w > MOBILE_MAX && w <= TABLET_MAX;
      setVp({
        isMobile,
        isTablet,
        isDesktop: w > TABLET_MAX,
        isCompact: w <= TABLET_MAX,
      });
    };
    update();
    window.addEventListener("resize", update, { passive: true });
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return vp;
}

const FONT_IMPORT = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Outfit:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #2E2F3E; border-radius: 2px; }
  @keyframes fadeUp  { from { opacity:0; transform:translateY(8px);  } to { opacity:1; transform:translateY(0);  } }
  @keyframes slideIn { from { opacity:0; transform:translateX(14px); } to { opacity:1; transform:translateX(0); } }
  @keyframes pulse   { 0%,100%{opacity:1;} 50%{opacity:0.3;} }
  @keyframes shimmer { 0%{opacity:0.4;} 50%{opacity:1;} 100%{opacity:0.4;} }
  @keyframes spin    { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
  @keyframes blink   { 0%,100%{opacity:1;} 50%{opacity:0;} }
  @keyframes demoMarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  .demo-marquee-track { animation: demoMarquee 42s linear infinite; will-change: transform; }
  .demo-marquee-track:hover { animation-play-state: paused; }
  @keyframes slideUp { from { transform: translateY(100%); opacity: 0.85; } to { transform: translateY(0); opacity: 1; } }

  .ast-root { height: 100vh; height: 100dvh; overflow: hidden; }
  .ast-main-stack { min-width: 0; }
  .ast-mobile-top { display: none; }
  .ast-bottom-nav { display: none; }
  .ast-backdrop { display: none; }
  .ast-mobile-menu-btn { display: none; }

  @media (max-width: 767px) {
    .ast-shell { position: relative; min-height: 0; }
    .ast-sidebar {
      position: fixed !important;
      top: 24px;
      left: 0;
      bottom: 0;
      z-index: 300;
      transform: translateX(-105%);
      width: min(280px, 88vw) !important;
      min-width: 0 !important;
      transition: transform 0.25s cubic-bezier(0.4,0,0.2,1), width 0.22s !important;
      box-shadow: 8px 0 32px rgba(0,0,0,0.45);
    }
    .ast-sidebar.ast-open { transform: translateX(0); }
    .ast-backdrop {
      display: block;
      position: fixed;
      inset: 0;
      top: 24px;
      background: rgba(0,0,0,0.55);
      z-index: 290;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s;
    }
    .ast-backdrop.ast-visible { opacity: 1; pointer-events: auto; }
    .ast-mobile-top {
      display: flex !important;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      border-bottom: 1px solid #22232F;
      background: #0F1016;
      flex-shrink: 0;
    }
    .ast-mobile-menu-btn {
      display: inline-flex !important;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border: 1px solid #22232F;
      border-radius: 6px;
      background: transparent;
      color: #8B8BA8;
      cursor: pointer;
      flex-shrink: 0;
    }
    .ast-bottom-nav {
      display: flex !important;
      align-items: stretch;
      justify-content: space-around;
      flex-shrink: 0;
      border-top: 1px solid #22232F;
      background: #0F1016;
      padding: 4px 2px calc(4px + env(safe-area-inset-bottom, 0px));
      z-index: 260;
    }
    .ast-bottom-nav-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      padding: 6px 2px;
      border: none;
      background: transparent;
      color: #8B8BA8;
      cursor: pointer;
      font-family: 'Outfit', sans-serif;
      font-size: 9px;
      letter-spacing: 0.04em;
      min-height: 44px;
      border-radius: 6px;
    }
    .ast-bottom-nav-item.ast-active { color: #D4233A; background: rgba(212,35,58,0.07); }
    .ast-view-header {
      flex-wrap: wrap !important;
      height: auto !important;
      min-height: 48px !important;
      padding: 8px 12px !important;
      row-gap: 8px !important;
    }
    .ast-view-header-title { flex: 1 1 auto !important; min-width: 0 !important; overflow: hidden; }
    .ast-view-header-actions {
      flex: 1 1 100% !important;
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 6px !important;
      justify-content: flex-end !important;
    }
    .ast-hide-mobile { display: none !important; }
    .ast-content-pad { padding: 14px 12px !important; }
    .ast-content-pad-lg { padding: 18px 14px !important; }
    .ast-input-bar { padding: 10px 12px !important; }
    .ast-input-row { flex-wrap: wrap !important; gap: 8px !important; }
    .ast-input-row > button { flex: 1 1 100%; justify-content: center; }
    .ast-input-tags { display: none !important; }
    .ast-user-bubble { max-width: 90% !important; }
    .ast-answer-col { max-width: none !important; }
    .ast-panel-r {
      position: fixed !important;
      inset: 0 !important;
      top: auto !important;
      height: min(88vh, 720px) !important;
      width: 100% !important;
      max-width: 100% !important;
      border-left: none !important;
      border-top: 1px solid #22232F !important;
      border-radius: 12px 12px 0 0 !important;
      z-index: 280 !important;
      box-shadow: 0 -12px 40px rgba(0,0,0,0.55) !important;
      animation: slideUp 0.25s ease !important;
    }
    .ast-panel-overlay-backdrop {
      position: fixed;
      inset: 0;
      top: 24px;
      background: rgba(0,0,0,0.45);
      z-index: 275;
    }
    .ast-split-row { flex-direction: column !important; }
    .ast-split-list {
      width: 100% !important;
      border-right: none !important;
      max-height: 46vh !important;
      flex-shrink: 0 !important;
    }
    .ast-split-detail { flex: 1 !important; min-height: 0 !important; width: 100% !important; }
    .ast-three-col { flex-direction: column !important; overflow-y: auto !important; }
    .ast-panel-l {
      width: 100% !important;
      max-width: 100% !important;
      border-right: none !important;
      border-bottom: 1px solid #22232F !important;
      max-height: 42vh !important;
      flex-shrink: 0 !important;
    }
    .ast-panel-r-inline {
      width: 100% !important;
      max-height: 38vh !important;
      border-left: none !important;
      border-top: 1px solid #22232F !important;
    }
    .ast-filter-row {
      overflow-x: auto !important;
      flex-wrap: nowrap !important;
      -webkit-overflow-scrolling: touch;
      padding-bottom: 4px !important;
      max-width: 100%;
    }
    .ast-filter-row > * { flex-shrink: 0 !important; }
    .ast-doc-grid { grid-template-columns: 1fr !important; }
    .ast-export-modal { width: calc(100vw - 32px) !important; max-width: 420px !important; padding: 20px 18px !important; margin: 16px !important; }
    .ast-marquee-bar { height: 24px !important; }
    .ast-demo-marquee-track { font-size: 9px !important; }
    .ast-editor-side { width: 100% !important; max-height: 36vh !important; border-left: none !important; border-top: 1px solid #22232F !important; }
    .ast-intake-actions { flex-wrap: wrap !important; gap: 6px !important; }
    .ast-intake-actions > * { flex: 1 1 auto; }
  }

  @media (max-width: 767px) and (orientation: landscape) {
    .ast-panel-r { height: min(94vh, 100%) !important; border-radius: 0 !important; top: 24px !important; }
    .ast-split-list, .ast-panel-l, .ast-panel-r-inline { max-height: 34vh !important; }
    .ast-bottom-nav { padding-top: 2px; padding-bottom: calc(2px + env(safe-area-inset-bottom, 0px)); }
    .ast-bottom-nav-item { min-height: 38px; padding: 4px 2px; }
  }

  @media (min-width: 768px) and (max-width: 1023px) {
    .ast-sidebar-expanded { width: 188px !important; min-width: 188px !important; }
    .ast-panel-r-narrow { width: 210px !important; }
    .ast-panel-l-narrow { width: 240px !important; }
    .ast-content-pad-tablet { padding: 18px 16px !important; }
    .ast-view-header { padding: 0 16px !important; }
    .ast-hide-tablet { display: none !important; }
    .ast-filter-row { flex-wrap: wrap !important; }
  }
`;

const C = {
  bg:"#0B0C11", bgPanel:"#0F1016", bgCard:"#16171F", bgHover:"#1E1F2A",
  border:"#22232F", borderMid:"#2C2D3D",
  red:"#D4233A", redGlow:"rgba(212,35,58,0.15)", redFaint:"rgba(212,35,58,0.07)",
  gold:"#C9974A", goldDim:"rgba(201,151,74,0.15)",
  textPri:"#EEEEF5", textSec:"#8B8BA8", textMut:"#4E4F66",
  green:"#2CB67D", amber:"#F0A844", blue:"#4A90D9",
};
const F = { serif:"'Cormorant Garamond',serif", sans:"'Outfit',sans-serif" };

// Raising this does not buy a longer document: the model's hidden thought step expands to
// fill whatever budget it is given (at 2400 it ran ~43s before any text appeared, versus
// ~31s at 2000, and no run of nine reached a signature block), and 2400 tokens already
// takes ~53s of generation against the 60s function ceiling.
const MAX_TOKENS = 2000;

// Turns a non-2xx response into a message that names the actual failure.
async function describeFailure(res) {
  let detail = "";
  try {
    const text = await res.text();
    try {
      const parsed = JSON.parse(text);
      detail = parsed?.error?.message ?? parsed?.error ?? text;
    } catch {
      detail = text;
    }
  } catch { /* body unreadable */ }
  if (typeof detail !== "string") detail = JSON.stringify(detail);
  detail = detail.trim();
  return detail ? `API ${res.status} — ${detail.slice(0, 300)}` : `API ${res.status}`;
}

async function callLLM({ sys, messages, stream = true }) {
  const init = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      sys,
      stream,
      max_tokens: MAX_TOKENS,
    }),
  };

  let res;
  try {
    res = await fetch("/api/chat", init);
  } catch {
    throw new Error("Could not reach the Astreya Gemma API — check the deployment and try again");
  }
  if (!res.ok) throw new Error(await describeFailure(res));
  return res;
}

// Extracts text from one OpenAI-format SSE chunk. Returns "" if nothing.
function extractChunk(raw) {
  try { const p = JSON.parse(raw); return p.choices?.[0]?.delta?.content ?? ""; }
  catch { return ""; }
}

// Extracts content from a non-streaming OpenAI-format response object.
function extractResponse(data) {
  return data.choices?.[0]?.message?.content ?? "";
}

/* ── NAV ── */
const NAV = [
  { id:"research", label:"Research"    },
  { id:"draft",    label:"Drafting"    },
  { id:"review",   label:"Due Diligence"},
  { id:"litigate", label:"Litigation"  },
  { id:"comply",   label:"Compliance"  },
  { id:"history",  label:"History"     },
  { id:"matters",  label:"My Matters"  },
];

const MATTERS = [
  { id:"m1", code:"AST-2026-0042", label:"ABC Corp v. XYZ Ltd",  type:"Commercial" },
  { id:"m2", code:"AST-2026-0039", label:"Rajan Kapoor – Bail",  type:"Criminal"   },
  { id:"m3", code:"AST-2026-0031", label:"Infosys – NDA Review", type:"Corporate"  },
  { id:"m4", code:"AST-2026-0028", label:"TaxCo GST Dispute",    type:"Tax"        },
];

/* ── DOCUMENT TYPES ── */
const DOC_TYPES = [
  { id:"nda",        label:"Non-Disclosure Agreement",    short:"NDA",     icon:"🔒", category:"Corporate"  },
  { id:"employment", label:"Employment Agreement",         short:"Employ.", icon:"👔", category:"Labour"     },
  { id:"spa",        label:"Share Purchase Agreement",     short:"SPA",     icon:"📈", category:"Corporate"  },
  { id:"service",    label:"Service Agreement",            short:"Service", icon:"🤝", category:"Commercial" },
  { id:"notice",     label:"Legal Notice",                 short:"Notice",  icon:"📨", category:"Litigation" },
  { id:"mou",        label:"Memorandum of Understanding",  short:"MOU",     icon:"📋", category:"Commercial" },
  { id:"lease",      label:"Leave & Licence Agreement",    short:"Lease",   icon:"🏠", category:"Property"   },
  { id:"term_sheet", label:"Term Sheet",                   short:"Term",    icon:"📝", category:"Corporate"  },
];

const INTAKE = {
  nda: [
    { key:"type",       label:"NDA Type",                    type:"select",   opts:["Mutual","One-Way (Disclosing)","One-Way (Receiving)"] },
    { key:"party_a",    label:"Party A — Full Name & Address", type:"text",    ph:"ABC Private Limited, Nariman Point, Mumbai – 400 021" },
    { key:"party_b",    label:"Party B — Full Name & Address", type:"text",    ph:"XYZ Technologies Pvt. Ltd., Whitefield, Bangalore – 560 066" },
    { key:"purpose",    label:"Purpose of Disclosure",        type:"text",     ph:"Evaluating a potential technology partnership" },
    { key:"duration",   label:"Confidentiality Period",       type:"select",   opts:["1 Year","2 Years","3 Years","5 Years","Perpetual"] },
    { key:"governing",  label:"Governing Law (State)",        type:"select",   opts:["Maharashtra","Karnataka","Delhi","Tamil Nadu","Telangana","Gujarat","West Bengal"] },
    { key:"dispute",    label:"Dispute Resolution",           type:"select",   opts:["Arbitration – Mumbai","Arbitration – Delhi","Arbitration – Bangalore","Civil Court Jurisdiction"] },
    { key:"non_solicit",label:"Non-Solicitation Clause",      type:"select",   opts:["Include (12 months)","Include (24 months)","Exclude"] },
  ],
  employment: [
    { key:"employer",   label:"Employer (Company Name)",      type:"text",     ph:"Acme Solutions Private Limited" },
    { key:"employee",   label:"Employee Name",                 type:"text",     ph:"Priya Sharma" },
    { key:"role",       label:"Designation / Role",           type:"text",     ph:"Senior Software Engineer" },
    { key:"ctc",        label:"Annual CTC (₹)",               type:"text",     ph:"18,00,000" },
    { key:"start",      label:"Date of Joining",              type:"text",     ph:"01 April 2026" },
    { key:"location",   label:"Place of Work",                type:"text",     ph:"Bangalore, Karnataka" },
    { key:"notice",     label:"Notice Period",                type:"select",   opts:["30 Days","60 Days","90 Days","3 Months","6 Months"] },
    { key:"governing",  label:"Governing Law (State)",        type:"select",   opts:["Karnataka","Maharashtra","Delhi","Tamil Nadu","Telangana","Gujarat"] },
  ],
  service: [
    { key:"provider",   label:"Service Provider",             type:"text",     ph:"Tech Solutions Pvt. Ltd." },
    { key:"client",     label:"Client",                       type:"text",     ph:"Enterprise Corp Ltd." },
    { key:"scope",      label:"Scope of Services",            type:"textarea", ph:"Software development, maintenance, and support services for the Client's platform…" },
    { key:"value",      label:"Contract Value (₹)",           type:"text",     ph:"25,00,000" },
    { key:"duration",   label:"Contract Duration",            type:"select",   opts:["6 Months","1 Year","2 Years","3 Years","On Completion"] },
    { key:"payment",    label:"Payment Terms",                type:"select",   opts:["Monthly","Quarterly","Milestone-based","50% Advance + 50% Completion"] },
    { key:"governing",  label:"Governing Law (State)",        type:"select",   opts:["Maharashtra","Karnataka","Delhi","Tamil Nadu","Telangana","Gujarat"] },
  ],
  notice: [
    { key:"sender",     label:"Sender (Advocate / Party)",    type:"text",     ph:"Adv. Rajesh Kumar, enrolled with Bar Council of Maharashtra" },
    { key:"recipient",  label:"Recipient Name & Address",     type:"text",     ph:"Mr. Suresh Patel, 12 MG Road, Pune – 411 001" },
    { key:"subject",    label:"Subject Matter",               type:"text",     ph:"Recovery of security deposit of ₹3,50,000" },
    { key:"facts",      label:"Brief Facts",                  type:"textarea", ph:"Your client entered into a Leave & Licence agreement dated 1 April 2023…" },
    { key:"demand",     label:"Demand / Relief Sought",       type:"text",     ph:"Refund of security deposit of ₹3,50,000 within 15 days" },
    { key:"deadline",   label:"Response Deadline",            type:"select",   opts:["7 Days","15 Days","30 Days","60 Days"] },
  ],
};
["spa","mou","lease","term_sheet"].forEach(id => { INTAKE[id] = INTAKE.nda; });

/* ── DRAFTING DEMO DATA ── */
const DEMO_DRAFT = {
  docType: "nda",
  // Values must match the INTAKE.nda select options verbatim, or the dropdowns render blank.
  form: {
    type:        "Mutual",
    party_a:     "Meridian Capital Advisors Private Limited, 14th Floor, Express Towers, Nariman Point, Mumbai – 400 021",
    party_b:     "Kestrel Analytics Private Limited, Prestige Tech Park, Marathahalli, Bengaluru – 560 103",
    purpose:     "Evaluating a potential technology partnership and joint go-to-market arrangement",
    duration:    "3 Years",
    governing:   "Maharashtra",
    dispute:     "Arbitration – Mumbai",
    non_solicit: "Include (12 months)",
  },
  notes: "• Both parties will exchange technical and commercial information — keep obligations mutual\n• Carve out residuals from the confidentiality obligation\n• Injunctive relief must be available without furnishing security",
  content: `MUTUAL NON-DISCLOSURE AGREEMENT

This Mutual Non-Disclosure Agreement ("Agreement") is made at Mumbai on this 27th day of July, 2026.

BETWEEN

MERIDIAN CAPITAL ADVISORS PRIVATE LIMITED, a company incorporated under the Companies Act, 2013, having its registered office at 14th Floor, Express Towers, Nariman Point, Mumbai – 400 021 (hereinafter "Party A", which expression shall, unless repugnant to the context, include its successors and permitted assigns);

AND

KESTREL ANALYTICS PRIVATE LIMITED, a company incorporated under the Companies Act, 2013, having its registered office at Prestige Tech Park, Marathahalli, Bengaluru – 560 103 (hereinafter "Party B", which expression shall, unless repugnant to the context, include its successors and permitted assigns).

Party A and Party B are referred to individually as a "Party" and collectively as the "Parties".

RECITALS

A. The Parties propose to evaluate a potential technology partnership and joint go-to-market arrangement (the "Purpose").
B. For the Purpose, each Party may disclose to the other certain confidential and proprietary information.
C. The Parties wish to record the terms on which such information shall be disclosed, received and protected.

NOW THEREFORE, in consideration of the mutual covenants herein and other good and valuable consideration within the meaning of Section 2(d) of the Indian Contract Act, 1872, the Parties agree as follows:

1. DEFINITIONS

1.1 "Confidential Information" means all information, in whatever form, disclosed by or on behalf of the Disclosing Party to the Receiving Party in connection with the Purpose, including business plans, financial data, customer lists, source code, algorithms, technical specifications, pricing and trade secrets, whether or not marked "confidential".

1.2 "Disclosing Party" means the Party disclosing Confidential Information, and "Receiving Party" means the Party receiving it.

1.3 "Representatives" means the directors, officers, employees and professional advisers of a Party who have a bona fide need to know the Confidential Information for the Purpose.

2. OBLIGATIONS OF CONFIDENTIALITY

2.1 The Receiving Party shall hold all Confidential Information in strict confidence and shall not disclose it to any third party without the prior written consent of the Disclosing Party.

2.2 The Receiving Party shall use the Confidential Information solely for the Purpose and for no other purpose whatsoever.

2.3 The Receiving Party shall apply security measures no less rigorous than those it applies to its own confidential information, and in no event less than reasonable care, including such reasonable security practices and procedures as are contemplated under Section 43A of the Information Technology Act, 2000.

2.4 The Receiving Party may disclose Confidential Information to its Representatives, provided each is bound by obligations no less protective than those contained herein, and the Receiving Party shall remain liable for their acts and omissions.

3. EXCLUSIONS

3.1 The obligations in Clause 2 shall not apply to information that: (a) is or becomes publicly available otherwise than through breach of this Agreement; (b) was lawfully in the Receiving Party's possession free of any restriction prior to disclosure; (c) is lawfully received from a third party without restriction; or (d) is independently developed without use of or reference to the Confidential Information.

3.2 Residuals. Nothing in this Agreement restricts a Party's Representatives from using general knowledge, skills and experience retained in unaided memory, provided that no Confidential Information is intentionally recalled or reproduced.

4. COMPELLED DISCLOSURE

4.1 Where the Receiving Party is required to disclose Confidential Information by law, regulation, or an order of a court or authority of competent jurisdiction, it shall, to the extent legally permissible, give prompt written notice to the Disclosing Party and disclose only that portion which it is legally required to disclose.

5. TERM AND SURVIVAL

5.1 This Agreement commences on the date first written above and continues for a period of three (3) years.

5.2 The confidentiality obligations in Clause 2 shall survive for three (3) years from the date of expiry or termination of this Agreement, and indefinitely in respect of any information constituting a trade secret.

6. NON-SOLICITATION

6.1 During the term of this Agreement and for a period of twelve (12) months thereafter, neither Party shall directly solicit for employment any employee of the other Party with whom it had contact in connection with the Purpose, provided that general advertisements not specifically targeted at such employees shall not constitute solicitation.

7. NO LICENCE AND NO REPRESENTATION

7.1 All Confidential Information remains the property of the Disclosing Party. Nothing in this Agreement grants any licence or right under any patent, copyright, trade mark or other intellectual property.

7.2 The Disclosing Party makes no representation or warranty as to the accuracy or completeness of the Confidential Information.

8. RETURN OR DESTRUCTION

8.1 Upon written demand, or upon expiry of this Agreement, the Receiving Party shall promptly return or irretrievably destroy all Confidential Information and certify such destruction in writing, save for one archival copy retained solely for legal or regulatory compliance.

9. REMEDIES

9.1 The Parties acknowledge that damages alone may be an inadequate remedy for breach of this Agreement, and that the Disclosing Party shall be entitled to seek injunctive relief and specific performance under the Specific Relief Act, 1963, without the requirement to furnish security, in addition to all other remedies available in law or in equity.

10. GOVERNING LAW AND DISPUTE RESOLUTION

10.1 This Agreement shall be governed by and construed in accordance with the laws of India, and subject to Clause 10.2 the courts at Mumbai, Maharashtra shall have exclusive jurisdiction.

10.2 Any dispute arising out of or in connection with this Agreement shall be referred to and finally resolved by arbitration by a sole arbitrator appointed by mutual consent, under the Arbitration and Conciliation Act, 1996. The seat and venue of arbitration shall be Mumbai and the language of the proceedings shall be English.

11. GENERAL

11.1 Entire Agreement. This Agreement constitutes the entire understanding between the Parties on its subject matter and supersedes all prior discussions and understandings.

11.2 Amendment. No amendment or variation shall be valid unless made in writing and signed by both Parties.

11.3 Assignment. Neither Party may assign or transfer this Agreement without the prior written consent of the other Party.

11.4 Severability. If any provision is held invalid or unenforceable, the remaining provisions shall continue in full force and effect.

11.5 No Waiver. No failure or delay in exercising any right shall operate as a waiver of that right.

11.6 Counterparts. This Agreement may be executed in counterparts, including by electronic signature valid under the Information Technology Act, 2000, each of which shall be deemed an original.

11.7 Stamp Duty. Stamp duty payable on this Agreement under the Maharashtra Stamp Act, 1958 shall be borne equally by the Parties.

IN WITNESS WHEREOF, the Parties have executed this Agreement on the date first written above.

For MERIDIAN CAPITAL ADVISORS PRIVATE LIMITED

_____________________________
Name:
Designation:
Date:

For KESTREL ANALYTICS PRIVATE LIMITED

_____________________________
Name:
Designation:
Date:

WITNESSES:

1. _____________________________

2. _____________________________`,
};

/* ── RESEARCH STATIC DATA ── */
const SAMPLE_Q = "Can an FIR be quashed by the High Court under Section 482 CrPC?";

/* ── TINY COMPONENTS ── */
const Spinner = () => <div style={{width:13,height:13,border:`2px solid ${C.border}`,borderTop:`2px solid ${C.red}`,borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>;

function Btn({ children, onClick, primary, style: sx={}, className="" }) {
  const base = {display:"flex",alignItems:"center",gap:5,padding:"6px 13px",borderRadius:5,fontSize:11,cursor:"pointer",fontFamily:F.sans,letterSpacing:"0.04em",transition:"all 0.15s",border:`1px solid ${primary?C.red:C.border}`,background:primary?C.red:"transparent",color:primary?"#fff":C.textSec,...sx};
  return (
    <button className={className} style={base} onClick={onClick}
      onMouseEnter={e=>{e.currentTarget.style.background=primary?"#B51D30":C.bgHover; if(!primary)e.currentTarget.style.color=C.textPri;}}
      onMouseLeave={e=>{e.currentTarget.style.background=primary?C.red:"transparent"; if(!primary)e.currentTarget.style.color=C.textSec;}}
    >{children}</button>
  );
}

const Label = ({children,mt=0}) => <div style={{fontSize:9,color:C.textMut,letterSpacing:"0.13em",textTransform:"uppercase",marginBottom:7,marginTop:mt}}>{children}</div>;

const DEMO_DISCLAIMER =
  "Demo build — no login required. Astreya is in alpha; some features may be limited or incomplete. Work is not persisted across page refresh.";

function DemoDisclaimerMarquee() {
  const item = (
    <span style={{ display:"inline-flex", alignItems:"center", gap:"2.5em", paddingRight:"2.5em" }}>
      <span style={{ fontSize:10, color:C.amber, fontFamily:F.sans, letterSpacing:"0.06em", fontWeight:500 }}>
        {DEMO_DISCLAIMER}
      </span>
      <span style={{ color:`${C.amber}55`, fontSize:8 }}>◆</span>
    </span>
  );
  return (
    <div
      role="status"
      aria-label={DEMO_DISCLAIMER}
      style={{
        flexShrink:0,
        background:`linear-gradient(90deg, ${C.amber}12, ${C.amber}08, ${C.amber}12)`,
        borderBottom:`1px solid ${C.amber}30`,
        overflow:"hidden",
        height:28,
      }}
      className="ast-marquee-bar"
    >
      <div className="demo-marquee-track ast-demo-marquee-track" style={{ display:"flex", width:"max-content", alignItems:"center", height:"100%" }}>
        {item}{item}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   WORD DOCUMENT EXPORT ENGINE
══════════════════════════════════════════════ */
function toWordDoc(text, title = "Document") {
  // Convert markdown-style text → clean HTML for Word
  const mdToHtml = (raw) => {
    let out = "";
    let inUl = false, inOl = false;
    const closeList = () => { if(inUl){out+="</ul>";inUl=false;} if(inOl){out+="</ol>";inOl=false;} };
    const esc = s => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    const inline = s => esc(s)
      .replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g,"<em>$1</em>")
      .replace(/`([^`]+)`/g,"<code>$1</code>");

    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t) { closeList(); out += "<br>"; continue; }
      if (t.startsWith("## ")) { closeList(); out+=`<h2>${inline(t.slice(3))}</h2>`; continue; }
      if (t.startsWith("# "))  { closeList(); out+=`<h1>${inline(t.slice(2))}</h1>`; continue; }
      if (/^[✅☐⚠🔴🟡🟢]/.test(t)){
        closeList();
        const emoji = t.charAt(0); const rest = t.slice(1).trim();
        out+=`<p class="check"><span class="em">${emoji}</span> ${inline(rest)}</p>`;
        continue;
      }
      if (t.startsWith("- ")||t.startsWith("• ")){
        if(inOl){out+="</ol>";inOl=false;}
        if(!inUl){out+="<ul>";inUl=true;}
        out+=`<li>${inline(t.replace(/^[-•]\s*/,""))}</li>`; continue;
      }
      if (/^\d+\./.test(t)){
        if(inUl){out+="</ul>";inUl=false;}
        if(!inOl){out+="<ol>";inOl=true;}
        out+=`<li>${inline(t.replace(/^\d+\.\s*/,""))}</li>`; continue;
      }
      if (t.startsWith("⚠")) { closeList(); out+=`<p class="disclaimer">${inline(t)}</p>`; continue; }
      if (/^---+$/.test(t))   { closeList(); out+="<hr>"; continue; }
      closeList();
      out+=`<p>${inline(t)}</p>`;
    }
    closeList();
    return out;
  };

  const bodyHtml = mdToHtml(text);
  const dateStr  = new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"});

  return `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office'
      xmlns:w='urn:schemas-microsoft-com:office:word'
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>${title}</title>
<!--[if gte mso 9]>
<xml><w:WordDocument><w:View>Print</w:View><w:Zoom>90</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml>
<![endif]-->
<style>
  @page WordSection1 { size:21cm 29.7cm; margin:2.54cm 2.54cm 2.54cm 2.54cm; mso-header-margin:35.4pt; mso-footer-margin:35.4pt; mso-paper-source:0; }
  div.WordSection1 { page:WordSection1; }
  body  { font-family:Calibri,sans-serif; font-size:11pt; color:#1A1A2E; line-height:1.6; }
  h1    { font-family:'Cormorant Garamond',Garamond,serif; font-size:22pt; font-weight:700; color:#0B0C11; margin:0 0 4pt; letter-spacing:2pt; }
  h2    { font-family:Calibri,sans-serif; font-size:10pt; font-weight:700; color:#555; margin:18pt 0 6pt; text-transform:uppercase; letter-spacing:1pt; border-bottom:1pt solid #DDD; padding-bottom:4pt; mso-border-bottom-alt:solid #DDD .5pt; }
  p     { margin:0 0 7pt; font-size:11pt; }
  ul,ol { margin:4pt 0 8pt 18pt; padding:0; }
  li    { margin:3pt 0; font-size:11pt; }
  strong{ font-weight:700; }
  em    { font-style:italic; }
  code  { font-family:'Courier New',monospace; font-size:10pt; background:#F5F5F5; padding:1pt 3pt; }
  hr    { border:none; border-top:1pt solid #DDD; margin:12pt 0; }
  .meta { font-size:9pt; color:#888; margin-bottom:14pt; }
  .check{ margin:3pt 0; font-size:11pt; }
  .em   { font-size:13pt; }
  .disclaimer { background:#FFF8E7; border-left:3pt solid #F0A844; padding:7pt 10pt; margin:14pt 0 4pt; font-size:10pt; color:#7A6020; mso-border-left-alt:solid #F0A844 2.25pt; }
  .footer{ margin-top:22pt; padding-top:8pt; border-top:1pt solid #EEE; font-size:8.5pt; color:#AAA; mso-border-top-alt:solid #EEE .5pt; }
  .logo { font-size:9pt; color:#D4233A; font-weight:700; letter-spacing:1pt; }
</style>
</head>
<body>
<div class="WordSection1">
<h1>${title.toUpperCase()}</h1>
<p class="meta">
  <span class="logo">ASTREYA</span>&nbsp;&nbsp;Indian Legal AI&nbsp;&nbsp;|&nbsp;&nbsp;Generated on ${dateStr}&nbsp;&nbsp;|&nbsp;&nbsp;Confidential — For Legal Use Only
</p>
<hr>
${bodyHtml}
<div class="footer">
  This document was generated by <strong>Astreya</strong> — an AI-powered Indian Legal Intelligence Platform. All content must be verified against primary sources (SCC Online, Manupatra, IndianKanoon) before reliance. This output does not constitute legal advice. Consult a qualified advocate before acting on any information herein.
</div>
</div>
</body>
</html>`;
}

function downloadDoc(htmlStr, filename) {
  const blob = new Blob(["\ufeff", htmlStr], { type:"application/msword;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename.endsWith(".doc")?filename:filename+".doc";
  document.body.appendChild(a); a.click();
  setTimeout(()=>{ document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
}

/* ── EXPORT MODAL ── */
function ExportModal({ defaultName, content, title, onClose }) {
  const [name, setName]   = useState(defaultName);
  const [done, setDone]   = useState(false);
  const inputRef          = useRef(null);

  useEffect(()=>{ setTimeout(()=>{ inputRef.current?.select(); },50); },[]);

  const handleExport = () => {
    const html = toWordDoc(content, title||name);
    downloadDoc(html, name||defaultName);
    setDone(true);
    setTimeout(onClose, 1200);
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.72)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,animation:"fadeIn 0.18s ease"}}
      onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div style={{background:C.bgPanel,border:`1px solid ${C.borderMid}`,borderRadius:12,padding:"28px 28px 24px",width:420,animation:"fadeUp 0.2s ease",boxShadow:"0 16px 48px rgba(0,0,0,0.6)"}} className="ast-export-modal">
        {/* header */}
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
          <div style={{width:32,height:32,background:C.redFaint,border:`1px solid ${C.redGlow}`,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>📄</div>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:C.textPri,fontFamily:F.sans}}>Export as Word Document</div>
            <div style={{fontSize:10,color:C.textMut,fontFamily:F.sans}}>Saves as .doc — opens in Microsoft Word</div>
          </div>
          <button onClick={onClose} style={{marginLeft:"auto",background:"transparent",border:"none",color:C.textMut,cursor:"pointer",fontSize:18,lineHeight:1,padding:4}}>×</button>
        </div>

        {/* filename input */}
        <div style={{marginBottom:18}}>
          <label style={{display:"block",fontSize:10,color:C.textSec,fontFamily:F.sans,letterSpacing:"0.05em",marginBottom:7}}>FILE NAME</label>
          <div style={{display:"flex",alignItems:"center",background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:7,overflow:"hidden",transition:"border-color 0.15s"}}
            onFocusCapture={e=>e.currentTarget.style.borderColor=C.red}
            onBlurCapture={e=>e.currentTarget.style.borderColor=C.border}>
            <input ref={inputRef} value={name} onChange={e=>setName(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter") handleExport(); if(e.key==="Escape") onClose(); }}
              style={{flex:1,background:"transparent",border:"none",outline:"none",padding:"10px 13px",fontSize:12.5,color:C.textPri,fontFamily:F.sans,fontWeight:300}}/>
            <span style={{padding:"0 12px",fontSize:11,color:C.textMut,borderLeft:`1px solid ${C.border}`,height:"100%",display:"flex",alignItems:"center",fontFamily:F.sans,background:C.bgHover}}>.doc</span>
          </div>
          <div style={{fontSize:9,color:C.textMut,fontFamily:F.sans,marginTop:5}}>You can rename this file any time after downloading.</div>
        </div>

        {/* format info */}
        <div style={{display:"flex",gap:8,marginBottom:20}}>
          {[["📝","Word (.doc)","Recommended"],["🔤","Formatted headings","Preserved"],["⚖","Astreya footer","Included"]].map(([ic,l,sub])=>(
            <div key={l} style={{flex:1,padding:"8px 10px",background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:6,textAlign:"center"}}>
              <div style={{fontSize:14,marginBottom:3}}>{ic}</div>
              <div style={{fontSize:9.5,color:C.textPri,fontFamily:F.sans,fontWeight:500}}>{l}</div>
              <div style={{fontSize:8.5,color:C.textMut,fontFamily:F.sans,marginTop:1}}>{sub}</div>
            </div>
          ))}
        </div>

        {/* actions */}
        <div style={{display:"flex",gap:8}}>
          <button onClick={onClose} style={{flex:1,padding:"10px",background:"transparent",border:`1px solid ${C.border}`,borderRadius:7,color:C.textSec,fontSize:12,cursor:"pointer",fontFamily:F.sans}}>Cancel</button>
          <button onClick={handleExport}
            style={{flex:2,padding:"10px",background:done?C.green:C.red,border:"none",borderRadius:7,color:"#fff",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:F.sans,transition:"background 0.3s",letterSpacing:"0.03em"}}
            onMouseEnter={e=>{ if(!done)e.currentTarget.style.background="#B51D30"; }}
            onMouseLeave={e=>{ if(!done)e.currentTarget.style.background=C.red; }}>
            {done?"✓ Downloaded!":"↓ Download Word Doc"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── RESEARCH SYSTEM PROMPT ── */
const RESEARCH_SYSTEM = `You are Astreya, an expert AI legal assistant specialising exclusively in Indian law. You help Indian lawyers, law firms, and researchers with precise, well-cited legal analysis.

RULES:
1. Answer ONLY questions about Indian law (statutes, case law, procedure, compliance).
2. Every factual claim MUST be supported by a citation in brackets — a statute section OR a case.
3. A RETRIEVED SOURCES block may follow the question. It is fetched live from IndianKanoon and outranks your own recollection — where it contradicts your memory, follow the block.
4. Cite a retrieved source exactly as given. Use its "Reported at" citation when one is supplied; when none is supplied, cite the case by title, court and date instead. NEVER invent an SCC / AIR / SCR reporter number for a case that lists none.
5. Ignore any retrieved source that does not bear on the question rather than forcing it into the answer. If the retrieved material is thin, say so plainly.
6. Structure responses clearly: use numbered points, headings, and citation anchors.
7. Always note when BNS 2023 / BNSS 2023 / BSA 2023 replace IPC / CrPC / Evidence Act (effective July 1, 2024).
8. Never hallucinate case names, citations, or section numbers. If uncertain, say so.
9. End every response with: "⚠ Research output only — verify with primary sources and consult a qualified advocate."`;

function ResearchView() {
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
      const res = await callLLM({ sys: RESEARCH_SYSTEM, messages: apiMessages, stream: true });
      const reader=res.body.getReader(); const decoder=new TextDecoder(); let full="";
      while(true){
        const{done,value}=await reader.read(); if(done)break;
        for(const line of decoder.decode(value).split("\n")){
          if(!line.startsWith("data: "))continue;
          const raw=line.slice(6).trim(); if(raw==="[DONE]")continue;
          const chunk = extractChunk(raw); if (chunk) { full += chunk; setStreamText(full); }
        }
      }
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
function DraftingView() {
  const [stage, setStage]             = useState("select"); // select | intake | generating | editor
  const [docType, setDocType]         = useState(null);
  const [form, setForm]               = useState({});
  const [notes, setNotes]             = useState("");
  const [docText, setDocText]         = useState("");
  const [streaming, setStreaming]     = useState(false);
  const [progress, setProgress]       = useState(0);
  const [wordCount, setWordCount]     = useState(0);
  const [clausePanel, setClausePanel] = useState(null);
  const [clauseAI, setClauseAI]       = useState("");
  const [clauseLoad, setClauseLoad]   = useState(false);
  const [exportModal, setExportModal] = useState(false);
  const editorWrap = useRef(null);

  const dtInfo  = DOC_TYPES.find(d=>d.id===docType);
  // Memoised so the identity stays stable across renders; generate() depends on it.
  const fields  = useMemo(() => (docType ? (INTAKE[docType] || INTAKE.nda) : []), [docType]);
  const filled  = fields.filter(f=>form[f.key]?.trim()).length;
  const pct     = fields.length ? Math.round((filled/fields.length)*100) : 0;

  const setF = (k,v) => setForm(p=>({...p,[k]:v}));

  /* ── GENERATE ── */
  const generate = useCallback(async () => {
    if (!docType) return;
    setStage("generating"); setDocText(""); setProgress(0); setStreaming(true);
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
      const res = await callLLM({ sys, messages:[{role:"user",content:usr}], stream:true });
      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let full = ""; let chars = 0;
      while (true) {
        const {done,value} = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split("\n");
        for (const ln of lines) {
          if (!ln.startsWith("data: ")) continue;
          const raw = ln.slice(6).trim();
          if (raw==="[DONE]") continue;
          const chunk = extractChunk(raw);
          if (chunk) {
            full += chunk; chars += chunk.length;
            setDocText(full);
            setProgress(Math.min(99,Math.round((chars/3200)*100)));
          }
        }
      }
      setProgress(100);
      setWordCount(full.trim().split(/\s+/).filter(Boolean).length);
      // ── Persist draft to storage ──
      try {
        const draftId = `draft_${Date.now()}`;
        const entry   = JSON.stringify({
          id: draftId, typeId: docType,
          typeLabel: dtInfo?.label || docType,
          typeIcon: dtInfo?.icon || "📝",
          typeShort: dtInfo?.short || "Doc",
          category: dtInfo?.category || "General",
          form: { ...form }, notes,
          content: full,
          wordCount: full.trim().split(/\s+/).filter(Boolean).length,
          createdAt: new Date().toISOString(),
        });
        await window.storage.set(draftId, entry);
        let idx = [];
        try { const r = await window.storage.get("drafts_index"); if(r) idx = JSON.parse(r.value); } catch{}
        idx.unshift(draftId);
        await window.storage.set("drafts_index", JSON.stringify(idx.slice(0, 100)));
      } catch { /* storage unavailable */ }
      setTimeout(()=>{ setStage("editor"); setStreaming(false); }, 400);
    } catch(err) {
      setDocText(`[Error: ${err.message}. Please try again.]`);
      setStage("editor"); setStreaming(false);
    }
  }, [docType, form, notes, dtInfo, fields]);

  /* ── DEMO ── */
  // Replays a canned NDA through the real generating → editor flow so the app can be
  // shown end-to-end without a model running.
  const demo = useCallback(() => {
    if (streaming) return;
    const text = DEMO_DRAFT.content;
    setDocType(DEMO_DRAFT.docType);
    setForm({ ...DEMO_DRAFT.form });
    setNotes(DEMO_DRAFT.notes);
    setDocText(""); setProgress(0); setWordCount(0);
    setStage("generating"); setStreaming(true);

    // Chunk size is derived from length so the replay always lands around 8 seconds.
    const chunk = Math.max(4, Math.ceil(text.length / 700));
    let i = 0;
    const tick = () => {
      if (i >= text.length) {
        setProgress(100);
        setWordCount(text.trim().split(/\s+/).filter(Boolean).length);
        setTimeout(()=>{ setStage("editor"); setStreaming(false); }, 400);
        return;
      }
      i = Math.min(text.length, i + chunk);
      setDocText(text.slice(0, i));
      setProgress(Math.min(99, Math.round((i/text.length)*100)));
      setTimeout(tick, 12);
    };
    setTimeout(tick, 300);
  }, [streaming]);

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
      <div className="ast-view-header" style={{height:52,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 22px",background:C.bgPanel,flexShrink:0}}>
        <div className="ast-view-header-title" style={{display:"flex",alignItems:"center",gap:8,fontSize:12}}>
          <span style={{color:C.textSec}}>Drafting</span><span style={{color:C.textMut}}>›</span><span style={{color:C.textPri}}>Select Document Type</span>
        </div>
        <div className="ast-view-header-actions" style={{display:"flex",gap:7,alignItems:"center"}}>
          <Btn onClick={demo} className="ast-hide-mobile">↻ Demo Mode</Btn>
        </div>
      </div>
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
      <div className="ast-view-header" style={{height:52,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 22px",background:C.bgPanel,flexShrink:0}}>
        <div className="ast-view-header-title" style={{display:"flex",alignItems:"center",gap:8,fontSize:12,minWidth:0}}>
          <span onClick={()=>setStage("select")} style={{color:C.textSec,cursor:"pointer"}} onMouseEnter={e=>e.target.style.color=C.textPri} onMouseLeave={e=>e.target.style.color=C.textSec}>Drafting</span>
          <span style={{color:C.textMut}}>›</span><span style={{color:C.textPri,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{dtInfo?.label}</span>
        </div>
        <div className="ast-intake-actions ast-view-header-actions" style={{display:"flex",alignItems:"center",gap:9}}>
          <span style={{fontSize:11,color:pct===100?C.green:C.textMut,fontFamily:F.sans}}>{pct}% complete</span>
          <Btn onClick={()=>setStage("select")}>← Back</Btn>
          <Btn primary onClick={generate}>Generate Draft →</Btn>
        </div>
      </div>
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
              {f.type==="select"
                ? <select value={form[f.key]||""} onChange={e=>setF(f.key,e.target.value)} style={{width:"100%",background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:7,padding:"9px 12px",color:form[f.key]?C.textPri:C.textMut,fontSize:12.5,fontFamily:F.sans,outline:"none",cursor:"pointer",appearance:"none"}}><option value="">Select…</option>{f.opts.map(o=><option key={o}>{o}</option>)}</select>
                : f.type==="textarea"
                ? <textarea value={form[f.key]||""} onChange={e=>setF(f.key,e.target.value)} placeholder={f.ph} style={{width:"100%",background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:7,padding:"9px 12px",color:C.textPri,fontSize:12.5,fontFamily:F.sans,outline:"none",resize:"vertical",minHeight:76,lineHeight:1.6,fontWeight:300}} onFocus={e=>e.target.style.borderColor=C.borderMid} onBlur={e=>e.target.style.borderColor=C.border}/>
                : <input value={form[f.key]||""} onChange={e=>setF(f.key,e.target.value)} placeholder={f.ph} style={{width:"100%",background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:7,padding:"9px 12px",color:C.textPri,fontSize:12.5,fontFamily:F.sans,outline:"none"}} onFocus={e=>e.target.style.borderColor=C.borderMid} onBlur={e=>e.target.style.borderColor=C.border}/>
              }
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
      <div style={{height:52,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",padding:"0 22px",background:C.bgPanel,flexShrink:0,gap:8,fontSize:12}}>
        <span style={{color:C.textSec}}>Drafting</span><span style={{color:C.textMut}}>›</span>
        <span style={{color:C.textPri}}>{dtInfo?.label}</span>
        <span style={{color:C.textMut,margin:"0 4px"}}>·</span>
        <Spinner/><span style={{fontSize:11,color:C.textMut,marginLeft:6}}>Generating…</span>
      </div>
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        {/* live preview */}
        <div style={{flex:1,overflowY:"auto",padding:"26px 34px"}}>
          <div style={{maxWidth:690}}>
            <div style={{marginBottom:18}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <span style={{fontSize:11,color:C.textSec,fontFamily:F.sans}}>Drafting {dtInfo?.label}…</span>
                <span style={{fontSize:11,color:C.red,fontWeight:600}}>{progress}%</span>
              </div>
              <div style={{height:2,background:C.bgHover,borderRadius:2}}>
                <div style={{width:`${progress}%`,height:"100%",background:C.red,borderRadius:2,transition:"width 0.2s"}}/>
              </div>
            </div>
            <div style={{fontFamily:F.sans,fontSize:12.5,color:C.textPri,lineHeight:1.88,fontWeight:300,whiteSpace:"pre-wrap"}}>
              {docText}
              {streaming&&<span style={{display:"inline-block",width:2,height:14,background:C.red,marginLeft:1,animation:"blink 1s step-end infinite",verticalAlign:"text-bottom"}}/>}
            </div>
          </div>
        </div>
        {/* status sidebar */}
        <div className="ast-editor-side ast-panel-r-narrow" style={{width:220,borderLeft:`1px solid ${C.border}`,background:C.bgPanel,padding:"18px 15px"}}>
          <Label>Generation Status</Label>
          {[
            {l:"Recitals & Definitions",done:progress>12},
            {l:"Core Obligations",     done:progress>30},
            {l:"Representations",      done:progress>48},
            {l:"Term & Termination",   done:progress>62},
            {l:"Dispute Resolution",   done:progress>76},
            {l:"General Provisions",   done:progress>88},
            {l:"Signature Block",      done:progress>=100},
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
      {/* toolbar */}
      <div style={{height:52,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 18px",background:C.bgPanel,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8,fontSize:12}}>
          <span onClick={()=>setStage("select")} style={{color:C.textSec,cursor:"pointer"}} onMouseEnter={e=>e.target.style.color=C.textPri} onMouseLeave={e=>e.target.style.color=C.textSec}>Drafting</span>
          <span style={{color:C.textMut}}>›</span><span style={{color:C.textPri}}>{dtInfo?.label}</span>
          <span style={{color:C.textMut,margin:"0 4px"}}>·</span>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:C.green,animation:"pulse 2s infinite"}}/>
            <span style={{fontSize:9,color:C.green,letterSpacing:"0.08em"}}>DRAFT READY</span>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontSize:11,color:C.textMut,fontFamily:F.sans,marginRight:4}}>{wordCount.toLocaleString()} words</span>
          <Btn onClick={()=>{setStage("intake");setDocText("");setNotes("");}}>← Regenerate</Btn>
          <Btn onClick={()=>setExportModal(true)}>↓ Export Word</Btn>
          <Btn onClick={()=>navigator.clipboard?.writeText(docText)}>Copy</Btn>
          <Btn primary>Save to Matter</Btn>
        </div>
      </div>
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
            {["Parties correctly identified","Governing law clause present","Dispute resolution mechanism","Execution / signature block","Stamp duty obligation checked","Annexures complete"].map((item,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:7,marginBottom:8,cursor:"pointer"}} onClick={e=>{const b=e.currentTarget.querySelector(".cb");b.style.background=b.style.background?"":`${C.green}30`;b.style.borderColor=b.style.borderColor===C.green?"":C.green;}}>
                <div className="cb" style={{width:13,height:13,borderRadius:3,border:`1px solid ${C.border}`,flexShrink:0,background:"transparent",transition:"all 0.15s"}}/>
                <span style={{fontSize:10.5,color:C.textSec,fontFamily:F.sans,lineHeight:1.4}}>{item}</span>
              </div>
            ))}
          </div>
          <div style={{padding:"10px 13px",borderTop:`1px solid ${C.border}`}}>
            <div style={{padding:"9px 10px",background:`${C.amber}0E`,border:`1px solid ${C.amber}33`,borderRadius:6}}>
              <div style={{fontSize:9,color:C.amber,fontWeight:600,letterSpacing:"0.08em",marginBottom:3}}>REMINDER</div>
              <p style={{fontSize:10,color:C.textMut,lineHeight:1.5}}>Have a licensed advocate review before execution. Stamp duty varies by state.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   RISK REVIEW VIEW
══════════════════════════════════════════════ */
const RISK_COLORS = { CRITICAL:"#D4233A", HIGH:"#E8692A", MEDIUM:"#F0A844", LOW:"#2CB67D", INFO:"#4A90D9" };
const RISK_BG     = { CRITICAL:"rgba(212,35,58,0.10)", HIGH:"rgba(232,105,42,0.10)", MEDIUM:"rgba(240,168,68,0.10)", LOW:"rgba(44,182,125,0.10)", INFO:"rgba(74,144,217,0.10)" };
const CONTRACT_TYPES = ["Non-Disclosure Agreement","Employment Agreement","Service / Consulting Agreement","Share Purchase Agreement","Leave & Licence / Lease","Vendor Agreement","Shareholders Agreement","Loan Agreement","Term Sheet / MOU","Other"];
const SAMPLE_CONTRACT = `NON-DISCLOSURE AGREEMENT

This Agreement is entered into between ABC Private Limited ("Disclosing Party") and XYZ Technologies Pvt. Ltd. ("Receiving Party").

1. CONFIDENTIAL INFORMATION
1.1 The Receiving Party shall hold all Confidential Information in strict confidence and shall not disclose it to any third party whatsoever.
1.2 The Receiving Party may use the Confidential Information solely for the purpose of evaluating a potential business relationship.

2. NON-COMPETE
2.1 The Receiving Party agrees that it shall not, directly or indirectly, engage in any business that competes with the Disclosing Party anywhere in India for a period of 5 years.

3. LIABILITY
3.1 In the event of any breach of this Agreement, the Receiving Party shall be liable for all losses, damages, costs and expenses of whatsoever nature and howsoever arising, without any limitation.

4. TERM
4.1 This Agreement shall remain in force for a period of 10 years from the date of execution.

5. GOVERNING LAW
5.1 This Agreement shall be governed by the laws of India.`;

function RiskReviewView() {
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
                {contractText.trim().split(/\s+/).filter(Boolean).length} words
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

/* ══════════════════════════════════════════════
   LITIGATION STRATEGY VIEW
══════════════════════════════════════════════ */
function LitigationView() {
  const [stage, setStage]       = useState("form");
  const [form, setForm]         = useState({});
  const [report, setReport]     = useState("");
  const [streaming, setStr]     = useState(false);
  const [progress, setProg]     = useState(0);
  const [exportModal, setExportModal] = useState(false);
  const scrollRef               = useRef(null);

  const setF = (k,v) => setForm(p=>({...p,[k]:v}));

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
      const res = await callLLM({ sys, messages:[{role:"user",content:usr}], stream:true });
      const reader = res.body.getReader(); const dec = new TextDecoder();
      let full=""; let chars=0;
      while(true){
        const {done,value}=await reader.read(); if(done)break;
        for(const ln of dec.decode(value).split("\n")){
          if(!ln.startsWith("data: "))continue;
          const raw=ln.slice(6).trim(); if(raw==="[DONE]")continue;
          const chunk = extractChunk(raw);
          if (chunk) { full+=chunk; chars+=chunk.length; setReport(full); setProg(Math.min(99,Math.round((chars/2800)*100))); }
        }
      }
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

/* ══════════════════════════════════════════════
   COMPLIANCE VIEW
══════════════════════════════════════════════ */
function ComplianceView() {
  const [stage, setStage]       = useState("form");
  const [form, setForm]         = useState({sectors:[]});
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

  const setF=(k,v)=>setForm(p=>({...p,[k]:v}));
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
      const res=await callLLM({ sys, messages:[{role:"user",content:usr}], stream:true });
      const reader=res.body.getReader();const dec=new TextDecoder();
      let full="";let chars=0;
      while(true){
        const{done,value}=await reader.read();if(done)break;
        for(const ln of dec.decode(value).split("\n")){
          if(!ln.startsWith("data: "))continue;
          const raw=ln.slice(6).trim();if(raw==="[DONE]")continue;
          const chunk = extractChunk(raw);
          if (chunk) { full+=chunk; chars+=chunk.length; setReport(full); setProg(Math.min(99,Math.round((chars/3000)*100))); }
        }
      }
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


/* ══════════════════════════════════════════════
   HISTORY VIEW  — all saved drafts
══════════════════════════════════════════════ */
function HistoryView() {
  const [drafts,   setDrafts]   = useState(null);
  const [selected, setSelected] = useState(null);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("ALL");
  const [exportMod,setExportMod]= useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const idxRes = await window.storage.get("drafts_index");
        if (!idxRes) { setDrafts([]); return; }
        const ids    = JSON.parse(idxRes.value);
        const loaded = [];
        for (const id of ids) {
          try { const r = await window.storage.get(id); if(r) loaded.push(JSON.parse(r.value)); } catch{}
        }
        setDrafts(loaded);
        if (loaded.length > 0) setSelected(loaded[0].id);
      } catch { setDrafts([]); }
    })();
  }, []);

  const deleteDraft = async (id) => {
    setDeleting(id);
    try {
      await window.storage.delete(id);
      let idx = [];
      try { const r = await window.storage.get("drafts_index"); if(r) idx = JSON.parse(r.value); } catch{}
      await window.storage.set("drafts_index", JSON.stringify(idx.filter(x=>x!==id)));
      const next = (drafts||[]).filter(d=>d.id!==id);
      setDrafts(next);
      if (selected===id) setSelected(next[0]?.id||null);
    } catch{}
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
                <button onClick={()=>{ if(window.confirm("Delete this draft? This cannot be undone.")) deleteDraft(sel.id); }} disabled={deleting===sel.id}
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

/* ══════════════════════════════════════════════
   MATTERS VIEW
══════════════════════════════════════════════ */
const MATTER_DATA = [
  { id:"m1", code:"AST-2026-0042", label:"ABC Corp v. XYZ Ltd",  type:"Commercial", status:"active",  court:"Bombay High Court",    updated:"Today",    desc:"Commercial dispute — breach of service agreement. Hearing listed for 14 May 2026.", tasks:3 },
  { id:"m2", code:"AST-2026-0039", label:"Rajan Kapoor – Bail",  type:"Criminal",   status:"urgent",  court:"Sessions Court, Delhi",  updated:"Today",    desc:"Anticipatory bail application under S.438 CrPC. Hearing tomorrow.", tasks:5 },
  { id:"m3", code:"AST-2026-0031", label:"Infosys – NDA Review", type:"Corporate",  status:"review",  court:"N/A",                    updated:"2 days ago",desc:"NDA risk review and redlining for proposed partnership with vendor.", tasks:1 },
  { id:"m4", code:"AST-2026-0028", label:"TaxCo GST Dispute",    type:"Tax",        status:"pending", court:"GST Appellate Authority", updated:"4 days ago",desc:"Appeal against GST demand of ₹42L — input tax credit disallowance.", tasks:2 },
  { id:"m5", code:"AST-2026-0019", label:"Mehta Family Trust",   type:"Civil",      status:"active",  court:"City Civil Court",       updated:"1 week ago",desc:"Partition suit — disputed ancestral property in Pune.", tasks:0 },
  { id:"m6", code:"AST-2026-0011", label:"StartupX – ESOP Plan", type:"Corporate",  status:"closed",  court:"N/A",                    updated:"3 weeks ago",desc:"ESOP scheme drafting and Companies Act compliance. Matter closed.", tasks:0 },
];
const STATUS_C = { active:C.green, urgent:C.red, review:C.amber, pending:C.blue, closed:C.textMut };
const TYPE_C   = { Commercial:C.gold, Criminal:C.red, Corporate:C.blue, Tax:C.amber, Civil:C.green };

function MattersView() {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter]     = useState("ALL");
  const [search, setSearch]     = useState("");

  const filtered = MATTER_DATA.filter(m=>{
    const matchFilter = filter==="ALL"||m.status.toUpperCase()===filter||(filter==="OPEN"&&m.status!=="closed");
    const matchSearch = !search.trim()||(m.label+m.code+m.type).toLowerCase().includes(search.toLowerCase());
    return matchFilter&&matchSearch;
  });
  const sel = selected ? MATTER_DATA.find(m=>m.id===selected) : null;
  const stats = { total:MATTER_DATA.length, active:MATTER_DATA.filter(m=>m.status==="active").length, urgent:MATTER_DATA.filter(m=>m.status==="urgent").length, closed:MATTER_DATA.filter(m=>m.status==="closed").length };

  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div className="ast-view-header" style={{height:52,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 22px",background:C.bgPanel,flexShrink:0}}>
        <div className="ast-view-header-title" style={{display:"flex",alignItems:"center",gap:8,fontSize:12,minWidth:0}}><span style={{color:C.textPri}}>My Matters</span><span style={{color:C.textMut,marginLeft:4}}>— {MATTER_DATA.length} total</span></div>
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

/* ══════════════════════════════════════════════
   ROOT APP
══════════════════════════════════════════════ */
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
