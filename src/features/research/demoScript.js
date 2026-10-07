import { SAMPLE_Q } from "@/features/research/prompts";

export { SAMPLE_Q };

export const DEMO_ANSWER =
  "Yes. A High Court holds inherent power to quash an FIR under **Section 482, CrPC 1973** (now **Section 528, BNSS 2023**, effective July 1, 2024). This power is discretionary and must be exercised sparingly.\n\n**Governing Framework**\n- Section 482 CrPC / Section 528 BNSS 2023\n- Article 226, Constitution of India\n\n**Seven Bhajan Lal Grounds** [1992 Supp (1) SCC 335]\n\n01. Allegations do not constitute a cognisable offence at face value\n02. Allegations are manifestly absurd or inherently impossible\n03. Offence not cognisable — police had no authority\n04. Prosecution attended with mala fide intent\n05. Proceeding filed to wreak vengeance or settle scores\n06. Continuing would amount to abuse of process\n07. Legal bar against initiation or continuance\n\n**Key Precedents**\n- *State of Haryana v. Bhajan Lal* — 1992 Supp (1) SCC 335\n- *Neeharika Infrastructure v. State of Maharashtra* — (2021) 19 SCC 401\n- *Pepsi Foods Ltd. v. Special Judicial Magistrate* — (1998) 5 SCC 749\n\n⚠ Research output only — verify with primary sources and consult a qualified advocate.";

export const DEMO_SOURCES = [
  {
    id: "1306176",
    kind: "statute",
    title: "Section 482 in The Code of Criminal Procedure, 1973",
    court: "Union of India - Section",
    date: "1974-01-25",
    citedBy: 644872,
    url: "https://indiankanoon.org/doc/1306176/",
    ref: 1,
    snippet: "Saving of inherent powers of High Court.",
  },
  {
    id: "1501908",
    kind: "judgment",
    title: "State of Haryana v. Bhajan Lal",
    citation: "1992 Supp (1) SCC 335",
    court: "Supreme Court of India",
    date: "1992-11-21",
    citedBy: 42800,
    url: "https://indiankanoon.org/doc/1501908/",
    ref: 2,
    snippet: "",
  },
  {
    id: "501105",
    kind: "judgment",
    title: "Neeharika Infrastructure v. State of Maharashtra",
    citation: "AIR 2021 SUPREME COURT 1918",
    court: "Supreme Court of India",
    date: "2021-04-13",
    citedBy: 3990,
    url: "https://indiankanoon.org/doc/501105/",
    ref: 3,
    snippet: "",
  },
  {
    id: "1279834",
    kind: "judgment",
    title: "Pepsi Foods Ltd. v. Special Judicial Magistrate",
    citation: "(1998) 5 SCC 749",
    court: "Supreme Court of India",
    date: "1998-04-07",
    citedBy: 8900,
    url: "https://indiankanoon.org/doc/1279834/",
    ref: 4,
    snippet: "",
  },
];

export const SUGGESTION_PROMPTS = [
  "Can FIR be quashed under S.482 CrPC?",
  "Rights of accused under BNSS 2023",
  "Cheque bounce procedure S.138 NI Act",
  "Bail under NDPS Act",
  "Director liability under IBC 2016",
  "DPDP Act 2023 obligations",
];
