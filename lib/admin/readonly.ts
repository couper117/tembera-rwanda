/**
 * The one message every admin write shows in this build.
 *
 * There is no database behind the admin screens — they are the finished UI,
 * waiting on a backend. Each action still validates its form (so the fields,
 * the error styling and the pending states are all exercised and reviewable)
 * and then stops here instead of writing.
 */
export const READ_ONLY_MESSAGE =
  "Read-only build — no backend is connected yet, so this change was not saved.";
