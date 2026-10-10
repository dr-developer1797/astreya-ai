"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { getClientWorkspaceKey } from "@/shared/convex/clientKey";

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const clientKey = useMemo(() => getClientWorkspaceKey(), []);
  const ensure = useMutation(api.workspaces.ensure);
  const [state, setState] = useState({
    ready: false,
    error: "",
    workspaceId: null,
    displayName: "Astreya Workspace",
    bootstrap: null,
  });

  useEffect(() => {
    if (!clientKey) return;
    let cancelled = false;
    (async () => {
      try {
        const bootstrap = await ensure({ clientKey });
        if (cancelled) return;
        setState({
          ready: true,
          error: "",
          workspaceId: bootstrap.workspaceId,
          displayName: bootstrap.displayName,
          bootstrap,
        });
      } catch (err) {
        if (cancelled) return;
        setState((prev) => ({
          ...prev,
          ready: false,
          error: err instanceof Error ? err.message : "Could not connect to Convex.",
        }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clientKey, ensure]);

  const value = useMemo(
    () => ({
      clientKey,
      ...state,
    }),
    [clientKey, state],
  );

  if (state.error) {
    return (
      <div style={{ padding: 24, fontFamily: "system-ui", color: "#f5a", background: "#0F1016", minHeight: "100vh" }}>
        {state.error}
      </div>
    );
  }

  if (!state.ready) {
    return (
      <div style={{ padding: 24, fontFamily: "system-ui", color: "#8B8BA8", background: "#0F1016", minHeight: "100vh" }}>
        Connecting workspace…
      </div>
    );
  }

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
