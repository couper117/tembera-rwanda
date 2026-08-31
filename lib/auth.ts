/**
 * Auth, with the backend removed.
 *
 * There is no database, no session cookie and no password hashing in this
 * build — the site is a static, browse-only catalog. The account screens are
 * kept as UI (see the notice each one renders) so a real implementation can be
 * dropped in behind this module without touching them.
 *
 * `getCurrentUser()` therefore always answers "signed out", which is the true
 * answer: nothing can sign in. Every caller already handles that branch, so
 * the whole UI degrades to its signed-out state on its own.
 */

/**
 * Kept at the shape the UI already consumes — the app shell reads every field
 * below to build its account context — so restoring a real user store is a
 * matter of returning a row here, not editing the screens.
 */
export interface User {
  id: number;
  email: string;
  name: string;
  handle: string;
  bio: string;
  homeCity: string;
  role: "USER" | "ADMIN";
  createdAt: Date;
}

/** Always null: there is no session store to read. */
export async function getCurrentUser(): Promise<User | null> {
  return null;
}

export function isAdmin(user: Pick<User, "role"> | null): boolean {
  return user?.role === "ADMIN";
}
