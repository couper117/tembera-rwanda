/**
 * Retry a query that failed because the connection dropped, not because the
 * query was wrong.
 *
 * Neon's serverless driver holds a WebSocket, and that socket dies on its own
 * schedule — an idle timeout, a pooler recycling, a laptop's wifi. What comes
 * back is `read ECONNRESET`, which says nothing about the statement and
 * everything about the pipe. The first request after one of those fails; the
 * next succeeds, because the driver has reconnected in between.
 *
 * That is survivable for a page render, which the reader will simply reload.
 * It is not survivable inside sign-in: Auth.js catches whatever `authorize`
 * throws and reports `CredentialsSignin`, so a dropped socket presents as
 * "Email or password is incorrect" — the app blaming the reader for its own
 * plumbing, and unfalsifiable from the outside.
 *
 * No `server-only` here on purpose: nothing in this file touches the database
 * or the request, and the predicate below is exactly the kind of string
 * matching that is worth tests. A module the test runner cannot import is a
 * module nobody tests.
 *
 * Only connection failures are retried. A unique-constraint violation or a
 * malformed query is not going to go better the second time, and retrying a
 * write that may have partly landed is worse than failing.
 */

/** The shapes a dropped connection arrives in. */
const TRANSIENT = [
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EPIPE",
  "socket hang up",
  "Connection closed",
  "Connection terminated",
  "terminating connection",
  "Server has closed the connection",
  "kind: Closed",
];

export function isTransientDbError(error: unknown): boolean {
  if (!error) return false;
  const text = [
    (error as { message?: string }).message,
    (error as { code?: string }).code,
    String(error),
  ]
    .filter(Boolean)
    .join(" ");
  return TRANSIENT.some((needle) => text.includes(needle));
}

/**
 * Run `query`, retrying a transient connection failure.
 *
 * Two attempts by default, with a short pause: the driver reconnects on the
 * next call, so the second attempt is usually enough, and a longer backoff
 * would just make a sign-in that was going to work anyway feel broken.
 */
export async function withDbRetry<T>(query: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await query();
    } catch (error) {
      lastError = error;
      if (!isTransientDbError(error) || attempt === attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, 120 * attempt));
    }
  }

  throw lastError;
}
