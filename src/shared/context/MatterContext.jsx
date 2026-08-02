"use client";

import { createContext, useContext, useState, useMemo } from "react";
import { MATTERS } from "@/shared/constants/matters";

const MatterContext = createContext(null);

export function MatterProvider({ children }) {
  const [matterId, setMatterId] = useState("m1");
  const matter = useMemo(
    () => MATTERS.find((m) => m.id === matterId) ?? MATTERS[0],
    [matterId],
  );

  const value = useMemo(
    () => ({ matterId, setMatterId, matter }),
    [matterId, matter],
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
