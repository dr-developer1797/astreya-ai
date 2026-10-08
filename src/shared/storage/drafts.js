import { countWords } from "@/shared/utils/text";

const INDEX_KEY = "astreya_drafts_index";
const MAX_DRAFTS = 100;
const draftKey = (id) => `astreya_draft_${id}`;

function readIndex() {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter((id) => typeof id === "string" && id))];
  } catch {
    return [];
  }
}

function writeIndex(ids) {
  const kept = ids.slice(0, MAX_DRAFTS);
  const evicted = ids.slice(MAX_DRAFTS);
  localStorage.setItem(INDEX_KEY, JSON.stringify(kept));
  for (const id of evicted) localStorage.removeItem(draftKey(id));
}

function storageError(err) {
  const detail = err instanceof Error && err.name === "QuotaExceededError"
    ? "Browser storage is full."
    : "Browser storage is unavailable.";
  return new Error(`${detail} Copy or export the draft to avoid losing it.`);
}

export async function saveDraft(entry) {
  const draftId = entry.id || `draft_${Date.now()}`;
  const key = draftKey(draftId);
  let previous = null;
  const payload = JSON.stringify({
    ...entry,
    id: draftId,
    matterId: entry.matterId ?? null,
    wordCount: entry.wordCount ?? countWords(entry.content || ""),
  });
  try {
    previous = localStorage.getItem(key);
    localStorage.setItem(key, payload);
    const idx = readIndex().filter((id) => id !== draftId);
    idx.unshift(draftId);
    writeIndex(idx);
    return draftId;
  } catch (err) {
    try {
      if (previous === null) localStorage.removeItem(key);
      else localStorage.setItem(key, previous);
    } catch {
      /* best-effort rollback */
    }
    throw storageError(err);
  }
}

export async function listDrafts() {
  try {
    const ids = readIndex();
    const loaded = [];
    for (const id of ids) {
      try {
        const raw = localStorage.getItem(draftKey(id));
        if (raw) loaded.push(JSON.parse(raw));
      } catch {
        localStorage.removeItem(draftKey(id));
      }
    }
    if (loaded.length !== ids.length) writeIndex(loaded.map((draft) => draft.id));
    return loaded;
  } catch {
    return [];
  }
}

export async function deleteDraft(id) {
  localStorage.removeItem(draftKey(id));
  writeIndex(readIndex().filter((x) => x !== id));
}
