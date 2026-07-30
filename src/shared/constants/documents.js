export const DOC_TYPES = [
  { id:"nda",        label:"Non-Disclosure Agreement",    short:"NDA",     icon:"🔒", category:"Corporate"  },
  { id:"employment", label:"Employment Agreement",         short:"Employ.", icon:"👔", category:"Labour"     },
  { id:"spa",        label:"Share Purchase Agreement",     short:"SPA",     icon:"📈", category:"Corporate"  },
  { id:"service",    label:"Service Agreement",            short:"Service", icon:"🤝", category:"Commercial" },
  { id:"notice",     label:"Legal Notice",                 short:"Notice",  icon:"📨", category:"Litigation" },
  { id:"mou",        label:"Memorandum of Understanding",  short:"MOU",     icon:"📋", category:"Commercial" },
  { id:"lease",      label:"Leave & Licence Agreement",    short:"Lease",   icon:"🏠", category:"Property"   },
  { id:"term_sheet", label:"Term Sheet",                   short:"Term",    icon:"📝", category:"Corporate"  },
];

export const INTAKE = {
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
