"use client";

import { useRef, useEffect, useCallback } from "react";

/** Returns a fresh AbortSignal for each operation; aborts in-flight work on unmount. */
export function useAbortController() {
  const controllerRef = useRef(null);
  const generationRef = useRef(0);

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  const getSignal = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = new AbortController();
    generationRef.current += 1;
    return controllerRef.current.signal;
  }, []);

  const getGeneration = useCallback(() => generationRef.current, []);

  const isStaleGeneration = useCallback((gen) => gen !== generationRef.current, []);

  const abort = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    generationRef.current += 1;
  }, []);

  return { getSignal, getGeneration, isStaleGeneration, abort };
}
