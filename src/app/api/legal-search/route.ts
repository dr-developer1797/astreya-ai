import { guardApiRequest } from "@/shared/api/guard";
import { logApiEvent } from "@/shared/api/log";

const IK_BASE = "https://api.indiankanoon.org";
const MAX_QUERY_LENGTH = 500;
const SEARCH_TIMEOUT_MS = 15_000;
const DOC_TIMEOUT_MS = 20_000;

// Indian Kanoon ranks an unfiltered query by raw keyword overlap, which buries the leading
// authorities under near-identical district-level petitions. Scoping each tier to a doctype
// is what surfaces the governing section alongside binding precedent.
const TIERS = [
  { kind: "statute", doctypes: "laws", take: 3 },
  { kind: "judgment", doctypes: "supremecourt", take: 5 },
  { kind: "judgment", doctypes: "highcourts", take: 3 },
] as const;

// Reporter citations live only in the full document, which runs to ~140KB apiece, so the
// lookup is capped. Full text is kept for even fewer, to stay inside a local model's context.
const CITATION_LOOKUPS = 4;
const FULL_TEXT_CHARS = 2200;
const MAX_STATUTES = 2;
const MAX_JUDGMENTS = 6;

type Tier = (typeof TIERS)[number];

type IKSearchDoc = {
  tid?: number;
  title?: string;
  headline?: string;
  docsource?: string;
  publishdate?: string;
  numcites?: number;
  numcitedby?: number;
};

type Source = {
  id: number;
  kind: Tier["kind"];
  title: string;
  court: string;
  date: string;
  citedBy: number;
  snippet: string;
  url: string;
  citation?: string;
  fullText?: string;
};

/* ── QUERY NORMALISATION ───────────────────────────────────────────────────────
   A verbatim question ("Can FIR be quashed under S.482 CrPC?") ranks badly: the
   interrogative words pull in unrelated judgments and the abbreviation never matches the
   statute's real title. Stripping the filler and expanding the abbreviation is what moves
   the governing section to the top of the statute tier.                                  */

const STOP_WORDS = new Set([
  "a", "an", "and", "any", "are", "as", "at", "be", "been", "but", "by", "can", "could",
  "did", "do", "does", "explain", "for", "from", "how", "i", "if", "in", "into", "is", "it",
  "its", "may", "me", "my", "of", "on", "or", "our", "please", "shall", "should", "so", "tell",
  "than", "that", "the", "their", "them", "then", "there", "these", "this", "to", "under",
  "was", "we", "were", "what", "when", "where", "whether", "which", "who", "will", "with",
  "would", "you", "your", "about",
]);

const ACT_EXPANSIONS: [RegExp, string][] = [
  [/\bcr\.?\s*p\.?\s*c\.?\b/gi, "Code of Criminal Procedure"],
  [/\bc\.?\s*p\.?\s*c\.?\b/gi, "Code of Civil Procedure"],
  [/\bi\.?\s*p\.?\s*c\.?\b/gi, "Indian Penal Code"],
  [/\bbnss\b/gi, "Bharatiya Nagarik Suraksha Sanhita"],
  [/\bbnsa?\b/gi, "Bharatiya Nyaya Sanhita"],
  [/\bbsa\b/gi, "Bharatiya Sakshya Adhiniyam"],
  [/\bn\.?\s*i\.?\s+act\b/gi, "Negotiable Instruments Act"],
  [/\bibc\b/gi, "Insolvency and Bankruptcy Code"],
  [/\bndps\b/gi, "Narcotic Drugs and Psychotropic Substances Act"],
  [/\bpmla\b/gi, "Prevention of Money Laundering Act"],
  [/\bposco\b|\bpocso\b/gi, "Protection of Children from Sexual Offences Act"],
  [/\bdpdpa?\b/gi, "Digital Personal Data Protection Act"],
  [/\bm\.?\s*v\.?\s+act\b/gi, "Motor Vehicles Act"],
  [/\bhma\b/gi, "Hindu Marriage Act"],
  [/\bt\.?\s*p\.?\s+act\b/gi, "Transfer of Property Act"],
  [/\bsarfaesi\b/gi, "Securitisation and Reconstruction of Financial Assets and Enforcement of Security Interest Act"],
  [/\bcgst\b/gi, "Central Goods and Services Tax Act"],
  [/\bgst\b/gi, "Goods and Services Tax Act"],
];

const SECTION_RE = /\b(?:sections?|secs?|ss?)\s*\.?\s*(\d+[A-Za-z-]*)/gi;
const ARTICLE_RE = /\barticles?\s*\.?\s*(\d+[A-Za-z-]*)/gi;

// Catches statutes a user spelled out in full ("Companies Act", "Specific Relief Act").
const WRITTEN_ACT_RE =
  /\b([A-Z][\w'-]*(?:\s+(?:of|and|the|for)\s+[\w'-]+|\s+[A-Z][\w'-]*)*\s+(?:Act|Code|Sanhita|Adhiniyam))\b/;

// Names are collected from the expansions that actually fired, rather than inferred from the
// prose afterwards: a title like "Insolvency and Bankruptcy Code" has no "Act" suffix to match.
function expandActs(text: string): { text: string; names: string[] } {
  const names: string[] = [];
  const expanded = ACT_EXPANSIONS.reduce((acc, [pattern, full]) => {
    const next = acc.replace(pattern, full);
    if (next !== acc) names.push(full);
    return next;
  }, text);

  if (names.length === 0) {
    const written = text.match(WRITTEN_ACT_RE);
    if (written) names.push(written[1]);
  }

  // "NDPS Act" expands to a title that already ends in "Act", leaving "... Act Act" behind.
  return { text: expanded.replace(/\b(Act|Code|Sanhita|Adhiniyam)\s+Act\b/gi, "$1"), names };
}

export function normalizeQuery(raw: string): {
  search: string;
  statute: string;
  anchor: string;
  actName: string;
} {
  const sections: string[] = [];
  const articles: string[] = [];

  // Collapse "S.482", "Sec 482" and "section482" into the form Indian Kanoon indexes.
  let text = raw.replace(SECTION_RE, (_m, num: string) => {
    sections.push(num.toUpperCase());
    return ` Section ${num.toUpperCase()} `;
  });
  text = text.replace(ARTICLE_RE, (_m, num: string) => {
    articles.push(num);
    return ` Article ${num} `;
  });

  // Stop words are dropped before expansion so the "of" inside an expanded act title survives.
  const kept = text
    .replace(/[^\p{L}\p{N}\s-]+/gu, " ")
    .split(/\s+/)
    .filter((word) => word && !STOP_WORDS.has(word.toLowerCase()));

  const expanded = expandActs(kept.join(" "));
  const search = expanded.text.replace(/\s+/g, " ").trim() || raw.trim();

  // The statute tier only matches when the section number sits beside the act's full title, so
  // it gets a query built from those two parts rather than the whole question.
  const anchor = sections[0] ? `Section ${sections[0]}` : articles[0] ? `Article ${articles[0]}` : "";
  const actName = expanded.names[0] ?? "";
  const statute = [anchor, actName].filter(Boolean).join(" ").trim() || search;

  return { search, statute, anchor, actName };
}

// The statute tier reliably nails the governing provision at rank 1 and then pads the list
// with unrelated state rules, so anything that matches neither the section nor the act is cut.
function isRelevantStatute(title: string, anchor: string, actName: string): boolean {
  if (!anchor && !actName) return true;
  const haystack = title.toLowerCase();
  return (
    (Boolean(anchor) && haystack.includes(anchor.toLowerCase())) ||
    (Boolean(actName) && haystack.includes(actName.toLowerCase()))
  );
}

/* ── HTML NORMALISATION ─────────────────────────────────────────────────────── */

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function decodeEntities(text: string): string {
  return text.replace(/&(#?\w+);/g, (match, code: string) => {
    const named = NAMED_ENTITIES[code.toLowerCase()];
    if (named) return named;
    if (code.startsWith("#")) {
      const isHex = /^#x/i.test(code);
      const num = Number.parseInt(isHex ? code.slice(2) : code.slice(1), isHex ? 16 : 10);
      if (Number.isFinite(num) && num > 0 && num <= 0x10ffff) return String.fromCodePoint(num);
    }
    return match;
  });
}

// Results arrive as HTML fragments carrying <b> highlight tags. The sources panel renders
// them as text, so markup is stripped here instead of being trusted in the browser.
function toPlainText(raw: string): string {
  const withoutMarkup = raw
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|li|h[1-6]|blockquote)>/gi, "\n")
    .replace(/<[^>]*>/g, " ");

  return decodeEntities(withoutMarkup)
    .replace(/[ \t\u00a0]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// A headline stitches several matched fragments together with "...", and the same fragment
// is frequently repeated. Duplicates are dropped so the excerpt carries new information.
function toSnippet(headline: string | undefined, limit = 320): string {
  if (!headline) return "";
  const seen = new Set<string>();
  const fragments: string[] = [];

  for (const raw of toPlainText(headline).split(/\s*\.\.\.\s*/)) {
    const fragment = raw.replace(/\*{2,}/g, " ").replace(/\s+/g, " ").trim();
    if (fragment.length < 12) continue;
    const key = fragment.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    fragments.push(fragment);
  }

  const joined = fragments.join(" … ");
  return joined.length > limit ? `${joined.slice(0, limit).trimEnd()}…` : joined;
}

// Titles embed the delivery date ("... vs State on 26 April, 2018"). Stripping it collapses
// the batches of separately-numbered petitions that share a single judgment text.
function dedupeKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+on\s+\d{1,2}\s+\w+,?\s+\d{4}\s*$/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/* ── INDIAN KANOON CALLS ────────────────────────────────────────────────────── */

async function ikPost(path: string, form: URLSearchParams, apiKey: string, timeoutMs: number) {
  const res = await fetch(`${IK_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) throw new Error(`Indian Kanoon responded ${res.status}`);
  return res.json() as Promise<unknown>;
}

async function searchTier(
  queries: { search: string; statute: string },
  tier: Tier,
  page: number,
  apiKey: string,
): Promise<Source[]> {
  const base = tier.kind === "statute" ? queries.statute : queries.search;
  // A caller-supplied doctypes filter wins, otherwise the query is scoped to this tier.
  const formInput = /doctypes\s*:/i.test(base) ? base : `${base} doctypes: ${tier.doctypes}`;
  const form = new URLSearchParams({ formInput, pagenum: String(page) });
  const payload = (await ikPost("/search/", form, apiKey, SEARCH_TIMEOUT_MS)) as {
    docs?: IKSearchDoc[];
  };
  const docs = Array.isArray(payload.docs) ? payload.docs : [];

  return docs
    .filter((doc): doc is IKSearchDoc & { tid: number } => typeof doc.tid === "number")
    .map((doc) => ({
      id: doc.tid,
      kind: tier.kind,
      title: toPlainText(doc.title || "") || "Untitled document",
      court: toPlainText(doc.docsource || ""),
      date: typeof doc.publishdate === "string" ? doc.publishdate.slice(0, 10) : "",
      // numcites counts what this document cites; numcitedby counts what cites it, which is
      // the direction that actually indicates authority.
      citedBy: typeof doc.numcitedby === "number" ? doc.numcitedby : 0,
      snippet: toSnippet(doc.headline),
      url: `https://indiankanoon.org/doc/${doc.tid}/`,
    }))
    .slice(0, tier.take);
}

const CITATION_BLOCK_RE = /<h3[^>]*class="doc_citations"[^>]*>([\s\S]*?)<\/h3>/i;

function extractCitation(docHtml: string): string {
  const match = docHtml.match(CITATION_BLOCK_RE);
  if (!match) return "";
  const cleaned = toPlainText(match[1]).replace(/^equivalent citations:\s*/i, "");
  // These lists run long; the first few reporters are enough to identify the judgment.
  return cleaned.split(/\s*,\s*/).filter(Boolean).slice(0, 3).join(", ");
}

async function fetchDocument(id: number, apiKey: string) {
  const payload = (await ikPost(`/doc/${id}/`, new URLSearchParams(), apiKey, DOC_TIMEOUT_MS)) as {
    doc?: unknown;
  };
  if (typeof payload.doc !== "string") return { citation: "", fullText: "" };

  const text = toPlainText(payload.doc);
  return {
    citation: extractCitation(payload.doc),
    fullText: text.length > FULL_TEXT_CHARS ? `${text.slice(0, FULL_TEXT_CHARS).trimEnd()}…` : text,
  };
}

/* ── HANDLER ────────────────────────────────────────────────────────────────── */

export async function POST(req: Request) {
  const blocked = guardApiRequest(req, "legal-search");
  if (blocked) return blocked;

  const started = Date.now();
  let payload: { query?: string; page?: number; enrich?: boolean };

  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const query = payload.query?.trim();
  if (!query) {
    return Response.json({ error: "A search query is required." }, { status: 400 });
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return Response.json({ error: "Search query is too long." }, { status: 413 });
  }

  const apiKey = process.env.INDIAN_KANOON_API_KEY || process.env.IndiaKanoon_API_KEY;

  // Legal research still works through Gemma when optional case-law search is not configured.
  if (!apiKey) {
    return Response.json({ sources: [], configured: false, degraded: false });
  }

  const queries = normalizeQuery(query);
  const page = Math.max(0, Math.floor(payload.page || 0));
  const settled = await Promise.allSettled(
    TIERS.map((tier) => searchTier(queries, tier, page, apiKey)),
  );

  // One dead tier should degrade the result set, not fail the whole search.
  const failed = settled.filter((r) => r.status === "rejected").length;
  if (failed === TIERS.length) {
    return Response.json({ error: "Indian Kanoon is temporarily unavailable." }, { status: 502 });
  }

  const seenIds = new Set<number>();
  const seenTitles = new Set<string>();
  const statutes: Source[] = [];
  const judgments: Source[] = [];

  for (const result of settled) {
    if (result.status !== "fulfilled") continue;
    for (const source of result.value) {
      const titleKey = dedupeKey(source.title);
      if (seenIds.has(source.id) || (titleKey && seenTitles.has(titleKey))) continue;

      if (source.kind === "statute") {
        if (statutes.length >= MAX_STATUTES) continue;
        if (!isRelevantStatute(source.title, queries.anchor, queries.actName)) continue;
        statutes.push(source);
      } else {
        if (judgments.length >= MAX_JUDGMENTS) continue;
        // A ruling nothing has cited yet adds little once real authority is present. The count
        // guard keeps recent-statute questions (BNSS, DPDP) from being filtered down to nothing,
        // since every judgment on those is still uncited.
        if (source.citedBy === 0 && judgments.length >= 3) continue;
        judgments.push(source);
      }

      seenIds.add(source.id);
      if (titleKey) seenTitles.add(titleKey);
    }
  }

  // Statutes lead so the model states the governing provision before reasoning from case law.
  const sources: Source[] = [...statutes, ...judgments];

  if (payload.enrich !== false && sources.length > 0) {
    // Reporter citations are absent from search results, and a wrong citation is the failure
    // mode that matters most here, so the leading sources are resolved to their real ones.
    const targets = [statutes[0], ...judgments]
      .filter((s): s is Source => Boolean(s))
      .slice(0, CITATION_LOOKUPS);
    const verbatim = new Set([statutes[0]?.id, judgments[0]?.id].filter(Boolean));

    await Promise.all(
      targets.map(async (source) => {
        try {
          const { citation, fullText } = await fetchDocument(source.id, apiKey);
          if (citation) source.citation = citation;
          // Only the governing section and the leading judgment carry their text forward.
          if (fullText && verbatim.has(source.id)) source.fullText = fullText;
        } catch {
          /* the snippet remains this source's grounding */
        }
      }),
    );
  }

  logApiEvent("legal-search.success", {
    ms: Date.now() - started,
    sources: sources.length,
    degraded: failed > 0,
  });

  return Response.json({
    sources,
    configured: true,
    degraded: failed > 0,
    normalizedQuery: queries.search,
  });
}
