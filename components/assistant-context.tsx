"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type AssistantContextValue = {
  isOpen: boolean;
  openAssistant: (seed?: string) => void;
  closeAssistant: () => void;
  seed: string | null;
  clearSeed: () => void;
};

const AssistantContext = createContext<AssistantContextValue | null>(null);

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const [seed, setSeed] = useState<string | null>(null);

  const openAssistant = useCallback((nextSeed?: string) => {
    if (nextSeed) setSeed(nextSeed);
    setOpen(true);
  }, []);

  const value = useMemo(
    () => ({
      isOpen,
      openAssistant,
      closeAssistant: () => setOpen(false),
      seed,
      clearSeed: () => setSeed(null),
    }),
    [isOpen, openAssistant, seed],
  );

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

export function useAssistant() {
  const context = useContext(AssistantContext);
  if (!context) throw new Error("useAssistant must be used inside AssistantProvider");
  return context;
}
