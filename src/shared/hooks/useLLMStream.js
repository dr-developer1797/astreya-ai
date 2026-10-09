"use client";

import { useState, useCallback } from "react";
import { streamChatCompletion, charBudgetFor } from "@/shared/llm/stream";
import { isAbortError } from "@/shared/llm/errors";
import { useAbortController } from "@/shared/hooks/useAbortController";

/**
 * Shared streaming hook for LLM feature views.
 * Centralises abort handling, generation tokens, and progress tracking.
 */
export function useLLMStream() {
  const { getSignal, getGeneration, isStaleGeneration, abort } = useAbortController();
  const [streaming, setStreaming] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  const stream = useCallback(async ({
    feature,
    featureOpts,
    messages,
    charBudget,
    onProgress,
    signal: externalSignal,
    generation: externalGen,
  }) => {
    const signal = externalSignal ?? getSignal();
    const gen = externalGen ?? getGeneration();
    const budget = charBudget ?? charBudgetFor(feature);

    setStreaming(true);
    setText("");
    setError(null);
    setProgress(0);

    try {
      let chars = 0;
      const full = await streamChatCompletion({
        feature,
        featureOpts,
        messages,
        signal,
        onToken: (accumulated, chunk) => {
          if (isStaleGeneration(gen)) return;
          chars += chunk.length;
          setText(accumulated);
          const pct = Math.min(99, Math.round((chars / budget) * 100));
          setProgress(pct);
          onProgress?.(accumulated, pct);
        },
      });
      if (isStaleGeneration(gen)) return null;
      setProgress(100);
      return full;
    } catch (err) {
      if (isAbortError(err) || isStaleGeneration(gen)) return null;
      const message = err instanceof Error ? err.message : "Request failed";
      setError(message);
      throw err;
    } finally {
      if (!isStaleGeneration(gen)) setStreaming(false);
    }
  }, [getSignal, getGeneration, isStaleGeneration]);

  const reset = useCallback(() => {
    setText("");
    setError(null);
    setProgress(0);
    setStreaming(false);
  }, []);

  return {
    streaming,
    text,
    error,
    progress,
    stream,
    abort,
    reset,
    isStaleGeneration,
    getGeneration,
    getSignal,
  };
}
