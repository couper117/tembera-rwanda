"use client";

// Places you've opened.
//
// Signed in: recorded as per-account rows (a repeat visit updates the time
// rather than adding a row), so the profile's "visited" count is real and
// follows you across devices. Signed out: kept in this browser only.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { recordVisitAction, clearVisitedAction } from "@/lib/actions/user";

const KEY = "tembera.visited";
const MAX = 60;

export interface Visit {
  id: string;
  /** Epoch ms of the most recent visit. */
  at: number;
}

/* ------------------------------------------------ guest localStorage */

function readLocal(): Visit[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (v): v is Visit =>
          !!v &&
          typeof v.id === "string" &&
          typeof v.at === "number" &&
          Number.isFinite(v.at),
      )
      .slice(0, MAX);
  } catch {
    return [];
  }
}

/* ----------------------------------------------------------- provider */

interface VisitedValue {
  visits: Visit[];
  ready: boolean;
  record: (id: string) => void;
  clear: () => void;
}

const VisitedContext = createContext<VisitedValue | null>(null);

export function VisitedProvider({
  authed,
  initialVisits,
  children,
}: {
  authed: boolean;
  initialVisits?: Visit[];
  children: ReactNode;
}) {
  const [visits, setVisits] = useState<Visit[]>(initialVisits ?? []);
  const [ready, setReady] = useState(authed);

  useEffect(() => {
    if (authed) return;
    setVisits(readLocal());
    setReady(true);
  }, [authed]);

  // Guest persistence lives here (not in `record`) so `record` can stay a
  // stable, dependency-free callback — VisitRecorder calls it from an effect,
  // and a `visits`-dependent callback would re-fire that effect on every visit.
  useEffect(() => {
    if (authed || !ready) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(visits));
    } catch {
      // ignore
    }
  }, [authed, ready, visits]);

  const record = useCallback(
    (id: string) => {
      if (!id) return;
      // Pure functional updater — no side effects in the render phase.
      setVisits((current) =>
        [{ id, at: Date.now() }, ...current.filter((v) => v.id !== id)].slice(0, MAX),
      );
      if (authed) void recordVisitAction(id);
    },
    [authed],
  );

  const clear = useCallback(() => {
    setVisits([]);
    if (authed) {
      void clearVisitedAction();
    } else {
      try {
        window.localStorage.removeItem(KEY);
      } catch {
        // ignore
      }
    }
  }, [authed]);

  const value = useMemo<VisitedValue>(
    () => ({ visits, ready, record, clear }),
    [visits, ready, record, clear],
  );

  return <VisitedContext.Provider value={value}>{children}</VisitedContext.Provider>;
}

export function useVisited(): VisitedValue {
  const ctx = useContext(VisitedContext);
  if (!ctx) throw new Error("useVisited must be used inside <VisitedProvider>");
  return ctx;
}
