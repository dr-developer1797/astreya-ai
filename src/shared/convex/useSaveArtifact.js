"use client";

import { useCallback, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useWorkspace } from "@/shared/convex/WorkspaceProvider";
import { useMatter } from "@/shared/context/MatterContext";

export function useSaveArtifact() {
  const { clientKey } = useWorkspace();
  const { matterId, matter } = useMatter();
  const save = useMutation(api.artifacts.save);
  const [saving, setSaving] = useState(false);
  const [lastError, setLastError] = useState("");

  const saveArtifact = useCallback(
    async ({ kind, title, content, meta }) => {
      if (!matterId) throw new Error("Select a matter first.");
      setSaving(true);
      setLastError("");
      try {
        const id = await save({
          clientKey,
          matterId,
          kind,
          title: title || `${kind} — ${matter?.label ?? "Matter"}`,
          content,
          meta,
        });
        return id;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Save failed.";
        setLastError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [clientKey, matter, matterId, save],
  );

  return { saveArtifact, saving, lastError, matterLabel: matter?.label };
}
