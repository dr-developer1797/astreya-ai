import { countWords } from "@/shared/utils/text";

export async function saveDraft(entry) {
  const draftId = entry.id || `draft_${Date.now()}`;
  const payload = JSON.stringify({
    ...entry,
    id: draftId,
    wordCount: entry.wordCount ?? countWords(entry.content || ""),
  });
  await window.storage.set(draftId, payload);
  let idx = [];
  try {
    const r = await window.storage.get("drafts_index");
    if (r) idx = JSON.parse(r.value);
  } catch {}
  idx.unshift(draftId);
  await window.storage.set("drafts_index", JSON.stringify(idx.slice(0, 100)));
  return draftId;
}

export async function listDrafts() {
  try {
    const idxRes = await window.storage.get("drafts_index");
    if (!idxRes) return [];
    const ids = JSON.parse(idxRes.value);
    const loaded = [];
    for (const id of ids) {
      try {
        const r = await window.storage.get(id);
        if (r) loaded.push(JSON.parse(r.value));
      } catch {}
    }
    return loaded;
  } catch {
    return [];
  }
}

export async function deleteDraft(id) {
  await window.storage.delete(id);
  let idx = [];
  try {
    const r = await window.storage.get("drafts_index");
    if (r) idx = JSON.parse(r.value);
  } catch {}
  await window.storage.set("drafts_index", JSON.stringify(idx.filter((x) => x !== id)));
}
