"use server";

export interface LoginState {
  error?: string;
}

/**
 * Admin sign-in, with the backend removed.
 *
 * There is no user table and no session cookie in this build, so there is
 * nothing to authenticate against. The form stays wired and says so plainly
 * rather than failing as though the password were wrong.
 *
 * The admin screens are reachable without signing in — they are read-only
 * sample data. Restoring this action and the guard in
 * app/admin/(dash)/layout.tsx is what re-closes the door.
 */
export async function login(
  _prev: LoginState,
  _formData: FormData,
): Promise<LoginState> {
  return {
    error:
      "Sign-in is not connected in this build — there is no accounts backend yet. The dashboard is open and read-only.",
  };
}
