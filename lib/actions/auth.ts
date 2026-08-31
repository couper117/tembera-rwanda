"use server";

export interface AuthState {
  error?: string;
}

/**
 * Sign-in and registration, with the backend removed.
 *
 * There is no user table, no password hashing and no session cookie in this
 * build. Both forms stay wired and say so, rather than reporting a wrong
 * password or appearing to create an account that does not exist.
 */
const NO_BACKEND =
  "Accounts are not connected yet — this build has no backend, so there is nothing to sign in to.";

export async function registerAction(
  _prev: AuthState,
  _formData: FormData,
): Promise<AuthState> {
  return { error: NO_BACKEND };
}

export async function loginAction(
  _prev: AuthState,
  _formData: FormData,
): Promise<AuthState> {
  return { error: NO_BACKEND };
}
