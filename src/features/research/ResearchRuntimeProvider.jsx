"use client";

import { useEffect, useRef } from "react";
import {
  AssistantRuntimeProvider,
  useAuiState,
  useLocalRuntime,
} from "@assistant-ui/react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { researchAdapter } from "@/features/research/researchBridge";
import { useWorkspace } from "@/shared/convex/WorkspaceProvider";

function ResearchStateSync() {
  const { clientKey } = useWorkspace();
  const messages = useAuiState((s) => s.thread.messages);
  const save = useMutation(api.researchState.save);
  const skipFirst = useRef(true);

  useEffect(() => {
    if (!clientKey) return;
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    const timer = setTimeout(() => {
      void save({
        clientKey,
        payload: JSON.stringify(messages),
      }).catch(() => {
        /* offline / quota — non-blocking */
      });
    }, 900);
    return () => clearTimeout(timer);
  }, [clientKey, messages, save]);

  return null;
}

function ResearchRuntimeInner({ children }) {
  const runtime = useLocalRuntime(researchAdapter);
  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ResearchStateSync />
      {children}
    </AssistantRuntimeProvider>
  );
}

/** Keeps the research thread alive while navigating between app routes (Sprint 3 / item 12). */
export default function ResearchRuntimeProvider({ children }) {
  const { ready } = useWorkspace();
  if (!ready) return children;
  return <ResearchRuntimeInner>{children}</ResearchRuntimeInner>;
}
