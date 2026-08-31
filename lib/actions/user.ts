"use server";

/**
 * Per-account writes, with the backend removed.
 *
 * Nothing here can persist: there are no accounts and no database. Saves and
 * visits are unaffected in practice — they are stored in the browser by
 * lib/client/saved.tsx and lib/client/visited.tsx, and these actions were only
 * ever the "also sync it to the account" half, called with `void` and ignored.
 * So they succeed silently, which is exactly what the client already assumes.
 *
 * Everything a signed-in person would do — edit a profile, change a password,
 * export or delete their data, post a review — returns a plain "not signed in"
 * error, because nobody can be signed in. The UI already renders that branch.
 */

const NOT_SIGNED_IN = "Not signed in.";

/* ------------------------------------------------------------ saved */

export async function toggleSaveAction(
  _placeId: string,
): Promise<{ saved: boolean } | { error: string }> {
  return { error: NOT_SIGNED_IN };
}

export async function clearSavedAction(): Promise<void> {}

/* ----------------------------------------------------------- visited */

export async function recordVisitAction(_placeId: string): Promise<void> {}

export async function clearVisitedAction(): Promise<void> {}

/* ----------------------------------------------------------- profile */

export async function updateProfileAction(
  _edits: unknown,
): Promise<{ ok: true } | { error: string }> {
  return { error: NOT_SIGNED_IN };
}

export async function changePasswordAction(
  _prev: { error?: string; ok?: boolean },
  _formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  return { error: NOT_SIGNED_IN };
}

export async function signOutEverywhereAction(): Promise<{ error?: string }> {
  return { error: NOT_SIGNED_IN };
}

export async function exportMyDataAction(): Promise<
  { ok: true; data: unknown } | { error: string }
> {
  return { error: NOT_SIGNED_IN };
}

export async function deleteMyAccountAction(
  _prev: { error?: string },
  _formData: FormData,
): Promise<{ error?: string }> {
  return { error: NOT_SIGNED_IN };
}

/* ----------------------------------------------------------- reviews */

export async function submitReviewAction(
  _input: unknown,
): Promise<{ ok: true } | { error: string }> {
  return { error: NOT_SIGNED_IN };
}

export async function deleteReviewAction(
  _placeId: string,
): Promise<{ ok: true } | { error: string }> {
  return { error: NOT_SIGNED_IN };
}
