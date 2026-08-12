"use client";

// Saved places. Local to the device — Tembera has no user accounts, so this is
// honest about what it is: a bookmark list in this browser. The Saved screen
// says so rather than implying a synced account.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const KEY = "tembera.saved";

interface SavedValue {
  ids: string[];
  /** False until the stored list has been read, so the UI can avoid a flash. */
  ready: boolean;
  isSaved: (id: string) => boolean;
  toggle: (id: string) => void;
  clear: () => void;
}

const SavedContext = createContext<SavedValue | null>(null);

export function SavedProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        setIds(parsed.filter((v): v is string => typeof v === "string"));
      }
    } catch {
      // Corrupt or unavailable storage: start empty rather than crash.
    }
    setReady(true);
  }, []);

  const persist = useCallback((next: string[]) => {
    setIds(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // Non-fatal: saves just won't survive a reload.
    }
  }, []);

  const toggle = useCallback(
    (id: string) => {
      setIds((current) => {
        const next = current.includes(id)
          ? current.filter((x) => x !== id)
          : [id, ...current];
        try {
          window.localStorage.setItem(KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    [],
  );

  const value = useMemo<SavedValue>(
    () => ({
      ids,
      ready,
      isSaved: (id: string) => ids.includes(id),
      toggle,
      clear: () => persist([]),
    }),
    [ids, ready, toggle, persist],
  );

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export function useSaved(): SavedValue {
  const ctx = useContext(SavedContext);
  if (!ctx) throw new Error("useSaved must be used inside <SavedProvider>");
  return ctx;
}
