"use client";

import { createContext, useContext, useMemo, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useWorkspace } from "@/shared/convex/WorkspaceProvider";

const MatterContext = createContext(null);

export function MatterProvider({ children }) {
  const { clientKey, ready } = useWorkspace();
  const setSelected = useMutation(api.matters.setSelected);

  const matters = useQuery(api.matters.list, ready ? { clientKey } : "skip");
  const selectedId = useQuery(api.matters.getSelected, ready ? { clientKey } : "skip");

  const matterId = selectedId ?? matters?.[0]?._id ?? null;

  const matter = useMemo(
    () => (matters ?? []).find((m) => m._id === matterId) ?? matters?.[0] ?? null,
    [matters, matterId],
  );

  const setMatterId = useCallback(
    async (id) => {
      if (!id || id === matterId) return;
      await setSelected({ clientKey, matterId: id });
    },
    [clientKey, matterId, setSelected],
  );

  const value = useMemo(
    () => ({
      matterId,
      setMatterId,
      matter,
      matters: matters ?? [],
      mattersLoading: matters === undefined,
    }),
    [matterId, setMatterId, matter, matters],
  );

  return (
    <MatterContext.Provider value={value}>
      {children}
    </MatterContext.Provider>
  );
}

export function useMatter() {
  const ctx = useContext(MatterContext);
  if (!ctx) throw new Error("useMatter must be used within MatterProvider");
  return ctx;
}
