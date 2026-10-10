const STORAGE_KEY = "astreya_workspace_key";

function randomKey() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `ws_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

/** Anonymous workspace key until Clerk auth ships; scopes Convex data per browser. */
export function getClientWorkspaceKey() {
  if (typeof window === "undefined") return "";
  try {
    let key = localStorage.getItem(STORAGE_KEY);
    if (!key || key.length < 16) {
      key = randomKey();
      localStorage.setItem(STORAGE_KEY, key);
    }
    return key;
  } catch {
    return randomKey();
  }
}
