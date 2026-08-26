"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin, getCurrentUser } from "@/lib/auth";

export async function setUserRole(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const role = String(formData.get("role") ?? "");
  if (!Number.isInteger(id) || (role !== "USER" && role !== "ADMIN")) {
    redirect("/admin/users");
  }

  // Guard: don't let an admin demote themselves and lock the door behind them.
  const me = await getCurrentUser();
  if (me && me.id === id && role === "USER") {
    redirect(`/admin/users?error=${encodeURIComponent("You cannot demote yourself.")}`);
  }

  await prisma.user.update({ where: { id }, data: { role } }).catch(() => {});
  redirect("/admin/users");
}

export async function deleteUser(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) redirect("/admin/users");

  const me = await getCurrentUser();
  if (me && me.id === id) {
    redirect(`/admin/users?error=${encodeURIComponent("You cannot delete your own account.")}`);
  }

  await prisma.user.delete({ where: { id } }).catch(() => {});
  redirect("/admin/users");
}
