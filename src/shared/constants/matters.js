import { C } from "./theme.js";

export const MATTERS = [
  { id:"m1", code:"AST-2026-0042", label:"ABC Corp v. XYZ Ltd",  type:"Commercial", status:"active",  court:"Bombay High Court",    updated:"Today",    desc:"Commercial dispute — breach of service agreement. Hearing listed for 14 May 2026.", tasks:3 },
  { id:"m2", code:"AST-2026-0039", label:"Rajan Kapoor – Bail",  type:"Criminal",   status:"urgent",  court:"Sessions Court, Delhi",  updated:"Today",    desc:"Anticipatory bail application under S.438 CrPC. Hearing tomorrow.", tasks:5 },
  { id:"m3", code:"AST-2026-0031", label:"Infosys – NDA Review", type:"Corporate",  status:"review",  court:"N/A",                    updated:"2 days ago",desc:"NDA risk review and redlining for proposed partnership with vendor.", tasks:1 },
  { id:"m4", code:"AST-2026-0028", label:"TaxCo GST Dispute",    type:"Tax",        status:"pending", court:"GST Appellate Authority", updated:"4 days ago",desc:"Appeal against GST demand of ₹42L — input tax credit disallowance.", tasks:2 },
  { id:"m5", code:"AST-2026-0019", label:"Mehta Family Trust",   type:"Civil",      status:"active",  court:"City Civil Court",       updated:"1 week ago",desc:"Partition suit — disputed ancestral property in Pune.", tasks:0 },
  { id:"m6", code:"AST-2026-0011", label:"StartupX – ESOP Plan", type:"Corporate",  status:"closed",  court:"N/A",                    updated:"3 weeks ago",desc:"ESOP scheme drafting and Companies Act compliance. Matter closed.", tasks:0 },
];
export const STATUS_C = { active:C.green, urgent:C.red, review:C.amber, pending:C.blue, closed:C.textMut };
export const TYPE_C   = { Commercial:C.gold, Criminal:C.red, Corporate:C.blue, Tax:C.amber, Civil:C.green };
