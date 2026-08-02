/** @returns {boolean} */
export function isAbortError(err) {
  if (!err) return false;
  if (err.name === "AbortError") return true;
  if (typeof DOMException !== "undefined" && err instanceof DOMException && err.name === "AbortError") {
    return true;
  }
  return false;
}

export function createAbortError(message = "Stream aborted") {
  if (typeof DOMException !== "undefined") {
    return new DOMException(message, "AbortError");
  }
  const err = new Error(message);
  err.name = "AbortError";
  return err;
}
