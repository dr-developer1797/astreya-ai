import { countWords } from "@/shared/utils/text";

const INDEX_KEY = "astreya_drafts_index";
const draftKey = (id) => `astreya_draft_${id}`;

function readIndex() {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeIndex(ids) {
  localStorage.setItem(INDEX_KEY, JSON.stringify(ids.slice(0, 100)));
}

export async function saveDraft(entry) {
  const draftId = entry.id || `draft_${Date.now()}`;
  const payload = JSON.stringify({
    ...entry,
    id: draftId,
    matterId: entry.matterId ?? null,
    wordCount: entry.wordCount ?? countWords(entry.content || ""),
  });
  localStorage.setItem(draftKey(draftId), payload);
  const idx = readIndex().filter((id) => id !== draftId);
  idx.unshift(draftId);
  writeIndex(idx);
  return draftId;
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
        /* skip corrupt entry */
      }
    }
    return loaded;
  } catch {
    return [];
  }
}

export async function deleteDraft(id) {
  localStorage.removeItem(draftKey(id));
  writeIndex(readIndex().filter((x) => x !== id));
}
