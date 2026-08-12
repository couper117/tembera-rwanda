"use client";

// The demo account.
//
// Tembera has no sign-in. Rather than pretend otherwise, the app ships with one
// local profile that behaves like a real one: it lives in this browser, every
// field is editable, and edits persist. Nothing is sent anywhere, and the
// profile screen says so.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const KEY = "tembera.account";

export interface Account {
  name: string;
  handle: string;
  email: string;
  bio: string;
  homeCity: string;
  /** ISO date. Set once when the profile is first created, never edited. */
  joinedAt: string;
}

/** Fields the user can change. `joinedAt` is deliberately not one of them. */
export type AccountEdits = Omit<Account, "joinedAt">;

/**
 * The seed profile. Obviously a placeholder rather than anyone real — this is a
 * demo directory, and inventing a plausible identity would be worse than an
 * obvious one.
 */
export const DEMO_ACCOUNT: Account = {
  name: "Demo User",
  handle: "demo",
  email: "demo@tembera.rw",
  bio: "Exploring Rwanda one place at a time. This is a demo profile — edit it and it stays on this device.",
  homeCity: "Kigali",
  joinedAt: "2026-01-08",
};

interface AccountValue {
  account: Account;
  /** False until storage has been read, so the UI can avoid a flash of seed data. */
  ready: boolean;
  update: (edits: Partial<AccountEdits>) => void;
  reset: () => void;
}

const AccountContext = createContext<AccountValue | null>(null);

/** Keeps a stored profile usable even if it predates a field being added. */
function normalise(raw: unknown): Account {
  if (!raw || typeof raw !== "object") return DEMO_ACCOUNT;
  const value = raw as Record<string, unknown>;
  const str = (key: keyof Account) =>
    typeof value[key] === "string" ? (value[key] as string) : DEMO_ACCOUNT[key];

  return {
    name: str("name"),
    handle: str("handle"),
    email: str("email"),
    bio: str("bio"),
    homeCity: str("homeCity"),
    joinedAt: str("joinedAt"),
  };
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account>(DEMO_ACCOUNT);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setAccount(normalise(JSON.parse(raw)));
    } catch {
      // Corrupt or unavailable storage: fall back to the seed profile.
    }
    setReady(true);
  }, []);

  const persist = useCallback((next: Account) => {
    setAccount(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // Non-fatal: the edit just won't survive a reload.
    }
  }, []);

  const value = useMemo<AccountValue>(
    () => ({
      account,
      ready,
      update: (edits) => persist({ ...account, ...edits }),
      reset: () => persist(DEMO_ACCOUNT),
    }),
    [account, ready, persist],
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount(): AccountValue {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccount must be used inside <AccountProvider>");
  return ctx;
}

/** Up to two letters for the avatar, falling back to something non-empty. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** "January 2026" — a join date only needs month precision. */
export function formatJoined(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "recently";
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}
