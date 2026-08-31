"use client";

// Saved places.
//
// Signed in: bookmarks are per-account rows in Postgres, synced across devices.
// The server hands the initial set to this provider and every toggle is
// persisted through a server action (optimistically, so the UI never waits).
// Signed out: falls back to a local bookmark list in this browser, so visitors
// can still collect places before deciding to create an account.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { toggleSaveAction, clearSavedAction } from "@/lib/actions/user";
import { useToast } from "@/components/ui/Toast";

const KEY = "tembera.saved";

interface SavedValue {
  ids: string[];
  ready: boolean;
  /** True when saves persist to an account rather than just this browser. */
  synced: boolean;
  isSaved: (id: string) => boolean;
  toggle: (id: string) => void;
  clear: () => void;
}

const SavedContext = createContext<SavedValue | null>(null);

export function SavedProvider({
  authed,
  initialIds,
  children,
}: {
  authed: boolean;
  initialIds?: string[];
  children: ReactNode;
}) {
  const [ids, setIds] = useState<string[]>(initialIds ?? []);
  const [ready, setReady] = useState(authed);
  const [, startTransition] = useTransition();
  const { toast } = useToast();

  // Guest: hydrate from localStorage once.
  useEffect(() => {
    if (authed) return;
    try {
      const raw = window.localStorage.getItem(KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        setIds(parsed.filter((v): v is string => typeof v === "string"));
      }
    } catch {
      // Corrupt/unavailable storage: start empty.
    }
    setReady(true);
  }, [authed]);

  const toggle = useCallback(
    (id: string) => {
      // Compute the next list and persist as a side effect of the *event*, not
      // inside the state updater — running a server action / startTransition
      // during React's render phase is illegal and drops the write.
      const previous = ids;
      const next = ids.includes(id) ? ids.filter((x) => x !== id) : [id, ...ids];
      setIds(next);
      if (authed) {
        // The result is awaited and acted on. Firing this off and ignoring it
        // leaves a filled heart above a save that never happened, which is
        // worse than an error: the user believes it worked.
        startTransition(async () => {
          const result = await toggleSaveAction(id);
          if ("error" in result) {
            setIds(previous);
            toast(result.error);
          }
        });
      } else {
        try {
          window.localStorage.setItem(KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
      }
    },
    [ids, authed, toast],
  );

  const clear = useCallback(() => {
    const previous = ids;
    setIds([]);
    if (authed) {
      startTransition(async () => {
        const result = await clearSavedAction();
        if (result.error) {
          setIds(previous);
          toast(result.error);
        }
      });
    } else {
      try {
        window.localStorage.removeItem(KEY);
      } catch {
        // ignore
      }
    }
  }, [ids, authed, toast]);

  const value = useMemo<SavedValue>(
    () => ({
      ids,
      ready,
      synced: authed,
      isSaved: (id: string) => ids.includes(id),
      toggle,
      clear,
    }),
    [ids, ready, authed, toggle, clear],
  );

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export function useSaved(): SavedValue {
  const ctx = useContext(SavedContext);
  if (!ctx) throw new Error("useSaved must be used inside <SavedProvider>");
  return ctx;
}
