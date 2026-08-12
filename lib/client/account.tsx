"use client";

// The user's profile.
//
// Signed in: the profile is the account — name, handle, email, bio and home
// city are real columns, and edits persist through a server action. Signed out:
// a local, editable demo profile lives in this browser so the profile screen is
// explorable before sign-up (and the screen says which mode it is in).

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { updateProfileAction } from "@/lib/actions/user";

const KEY = "tembera.account";

export interface Account {
  name: string;
  handle: string;
  email: string;
  bio: string;
  homeCity: string;
  /** ISO date. Set when the account was created; never edited. */
  joinedAt: string;
}

export type AccountEdits = Omit<Account, "joinedAt">;

/** The guest demo profile, editable in-browser. */
export const DEMO_ACCOUNT: Account = {
  name: "Guest",
  handle: "guest",
  email: "guest@tembera.rw",
  bio: "Browsing as a guest — sign in to sync your saves and reviews across devices.",
  homeCity: "Kigali",
  joinedAt: "2026-01-08",
};

interface AccountValue {
  account: Account;
  ready: boolean;
  /** True when the profile is a real account rather than a local demo. */
  authed: boolean;
  update: (edits: Partial<AccountEdits>) => Promise<{ error?: string }>;
  reset: () => void;
}

const AccountContext = createContext<AccountValue | null>(null);

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

export function AccountProvider({
  authed,
  initialAccount,
  children,
}: {
  authed: boolean;
  initialAccount?: Account | null;
  children: ReactNode;
}) {
  const [account, setAccount] = useState<Account>(initialAccount ?? DEMO_ACCOUNT);
  const [ready, setReady] = useState(authed);

  useEffect(() => {
    if (authed) return;
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setAccount(normalise(JSON.parse(raw)));
    } catch {
      // fall back to demo
    }
    setReady(true);
  }, [authed]);

  const update = useCallback(
    async (edits: Partial<AccountEdits>): Promise<{ error?: string }> => {
      const next = { ...account, ...edits };
      setAccount(next); // optimistic
      if (authed) {
        const res = await updateProfileAction({
          name: next.name,
          handle: next.handle,
          email: next.email,
          bio: next.bio,
          homeCity: next.homeCity,
        });
        if ("error" in res) {
          setAccount(account); // roll back
          return { error: res.error };
        }
        return {};
      }
      try {
        window.localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        // non-fatal
      }
      return {};
    },
    [account, authed],
  );

  const reset = useCallback(() => {
    if (authed) return; // a real account is not "resettable" to a demo
    setAccount(DEMO_ACCOUNT);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(DEMO_ACCOUNT));
    } catch {
      // ignore
    }
  }, [authed]);

  const value = useMemo<AccountValue>(
    () => ({ account, ready, authed, update, reset }),
    [account, ready, authed, update, reset],
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount(): AccountValue {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccount must be used inside <AccountProvider>");
  return ctx;
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatJoined(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "recently";
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}
