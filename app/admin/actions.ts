"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  destroySession,
  verifyPassword,
} from "@/lib/auth";
import { loginSchema } from "@/lib/validation/admin";

export interface LoginState {
  error?: string;
}

/**
 * Shared login action for the admin dashboard. Verifies the user via prisma +
 * verifyPassword, then checks the account is an ADMIN before opening a session.
 * Returns friendly errors; redirects to /admin on success.
 */
export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Invalid credentials" };
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  // Always run a compare to keep timing roughly constant for unknown emails.
  const hash = user?.passwordHash ?? "$2a$10$invalidinvalidinvalidinvalidinva";
  const ok = await verifyPassword(parsed.data.password, hash);

  if (!user || !ok) {
    return { error: "Invalid credentials" };
  }
  if (user.role !== "ADMIN") {
    return { error: "Not an admin account." };
  }

  await createSession(user.id);
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}
