"use client";

import { useRef, useEffect, useCallback } from "react";

/** Tracks setTimeout/setInterval IDs and clears them on unmount. */
export function useTimeoutCleanup() {
  const idsRef = useRef(new Set());

  useEffect(() => {
    const ids = idsRef.current;
    return () => {
      for (const id of ids) {
        clearTimeout(id);
        clearInterval(id);
      }
      ids.clear();
    };
  }, []);

  const scheduleTimeout = useCallback((fn, ms) => {
    const id = setTimeout(() => {
      idsRef.current.delete(id);
      fn();
    }, ms);
    idsRef.current.add(id);
    return id;
  }, []);

  const scheduleInterval = useCallback((fn, ms) => {
    const id = setInterval(fn, ms);
    idsRef.current.add(id);
    return id;
  }, []);

  const clearScheduled = useCallback((id) => {
    clearTimeout(id);
    clearInterval(id);
    idsRef.current.delete(id);
  }, []);

  return { scheduleTimeout, scheduleInterval, clearScheduled };
}
