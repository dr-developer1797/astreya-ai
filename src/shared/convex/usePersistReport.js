"use client";

import { useEffect, useRef } from "react";
import { useSaveArtifact } from "@/shared/convex/useSaveArtifact";

/** Saves a generated report once when it becomes available (Convex artifact + matter activity). */
export function usePersistReport({ kind, title, content, enabled, meta }) {
  const { saveArtifact } = useSaveArtifact();
  const lastSaved = useRef("");

  useEffect(() => {
    if (!enabled) return;
    const body = (content || "").trim();
    if (!body || body.length < 40) return;
    const fingerprint = `${kind}:${body.length}:${body.slice(0, 80)}`;
    if (lastSaved.current === fingerprint) return;
    lastSaved.current = fingerprint;
    void saveArtifact({
      kind,
      title,
      content: body,
      meta,
    }).catch(() => {
      lastSaved.current = "";
    });
  }, [kind, title, content, enabled, meta, saveArtifact]);
}
