function formatSource(d) {
  const lines = [`[${d.ref}] ${d.title}`];
  if (d.citation) lines.push(`    Reported at: ${d.citation}`);
  lines.push(`    Source: ${d.court || "N/A"} | Date: ${d.date || "N/A"} | Cited by ${d.citedBy} documents`);
  lines.push(`    URL: ${d.url}`);
  if (d.fullText) lines.push(`    Query-matched excerpt: ${d.fullText}`);
  else if (d.snippet) lines.push(`    Matched passage: ${d.snippet}`);
  return lines.join("\n");
}

export function buildIkContext(ikDocs) {
  if (!ikDocs?.length) return "";
  const statutes = ikDocs.filter((d) => d.kind === "statute");
  const rulings = ikDocs.filter((d) => d.kind !== "statute");
  return (
    "\n\n--- RETRIEVED SOURCES FROM INDIANKANOON ---\n" +
    [
      statutes.length ? "STATUTORY PROVISIONS:\n" + statutes.map(formatSource).join("\n\n") : "",
      rulings.length ? "JUDGMENTS:\n" + rulings.map(formatSource).join("\n\n") : "",
    ]
      .filter(Boolean)
      .join("\n\n") +
    "\n--- END RETRIEVED SOURCES ---"
  );
}

export async function fetchIkSources(query, { signal, page = 0 } = {}) {
  const ikRes = await fetch("/api/legal-search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, page }),
    signal,
  });
  const ikJson = await ikRes.json().catch(() => ({}));
  if (!ikRes.ok) throw new Error(ikJson.error || `Search failed (${ikRes.status})`);

  const sources = Array.isArray(ikJson.sources)
    ? ikJson.sources.map((d, i) => ({ ...d, ref: i + 1 }))
    : [];

  let warning = "";
  if (ikJson.configured === false) {
    warning = "Case-law search is not configured — answering from the model's own knowledge only.";
  } else if (sources.length === 0) {
    warning = "No IndianKanoon match for this query — answering without retrieved authority.";
  } else if (ikJson.degraded) {
    warning = "Part of IndianKanoon did not respond — results may be incomplete.";
  }

  return { sources, warning, configured: ikJson.configured !== false, degraded: Boolean(ikJson.degraded) };
}
