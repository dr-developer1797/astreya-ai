import { beforeEach, describe, expect, it, vi } from "vitest";
import { listDrafts, saveDraft } from "./drafts";

class MemoryStorage {
  constructor() {
    this.data = new Map();
  }

  getItem(key) {
    return this.data.has(key) ? this.data.get(key) : null;
  }

  setItem(key, value) {
    this.data.set(key, String(value));
  }

  removeItem(key) {
    this.data.delete(key);
  }
}

describe("draft storage", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", new MemoryStorage());
  });

  it("caps the index and removes evicted draft payloads", async () => {
    for (let i = 0; i < 101; i += 1) {
      await saveDraft({ id: `draft-${i}`, content: `Draft ${i}` });
    }

    const index = JSON.parse(localStorage.getItem("astreya_drafts_index"));
    expect(index).toHaveLength(100);
    expect(index[0]).toBe("draft-100");
    expect(localStorage.getItem("astreya_draft_draft-0")).toBeNull();
    expect(localStorage.getItem("astreya_draft_draft-100")).not.toBeNull();
  });

  it("recovers from a corrupted index on the next save", async () => {
    localStorage.setItem("astreya_drafts_index", "{not json");

    await saveDraft({ id: "recovered", content: "Safe" });

    expect(JSON.parse(localStorage.getItem("astreya_drafts_index"))).toEqual(["recovered"]);
    await expect(listDrafts()).resolves.toMatchObject([{ id: "recovered", content: "Safe" }]);
  });

  it("reports quota failures and rolls back a newly written payload", async () => {
    const originalSetItem = localStorage.setItem.bind(localStorage);
    let writes = 0;
    localStorage.setItem = vi.fn((key, value) => {
      writes += 1;
      if (writes === 2) {
        const error = new Error("quota");
        error.name = "QuotaExceededError";
        throw error;
      }
      originalSetItem(key, value);
    });

    await expect(saveDraft({ id: "too-large", content: "Draft" })).rejects.toThrow(
      "Browser storage is full",
    );
    expect(localStorage.getItem("astreya_draft_too-large")).toBeNull();
  });
});
