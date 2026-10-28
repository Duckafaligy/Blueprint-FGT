"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { AppState } from "./types";
import { makeSeed } from "./seed";

const KEY = "fgt-flow-demo-v1";

interface Ctx {
  state: AppState;
  /** mutate a clone of the state, then save it */
  update: (fn: (draft: AppState) => void) => void;
  reset: () => void;
  hydrated: boolean;
  toast: (msg: string, kind?: "ok" | "warn" | "bad") => void;
  toasts: { id: number; msg: string; kind: "ok" | "warn" | "bad" }[];
}

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => makeSeed());
  const [hydrated, setHydrated] = useState(false);
  const [toasts, setToasts] = useState<Ctx["toasts"]>([]);
  const idRef = useRef(1);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  const save = useCallback((s: AppState) => {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
  }, []);

  const update = useCallback((fn: (d: AppState) => void) => {
    const next = structuredClone(stateRef.current);
    fn(next);
    stateRef.current = next;
    setState(next);
    save(next);
  }, [save]);

  const toast = useCallback((msg: string, kind: "ok" | "warn" | "bad" = "ok") => {
    const id = idRef.current++;
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const reset = useCallback(() => {
    const s = makeSeed();
    stateRef.current = s;
    setState(s);
    try { localStorage.removeItem(KEY); } catch {}
    toast("Demo reset to the starting data");
  }, [toast]);

  const value = useMemo(() => ({ state, update, reset, hydrated, toast, toasts }), [state, update, reset, hydrated, toast, toasts]);
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp must be used inside AppProvider");
  return c;
}
