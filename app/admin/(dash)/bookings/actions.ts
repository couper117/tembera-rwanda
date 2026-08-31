"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const STATUSES = ["pending", "confirmed", "cancelled"] as const;
type BookingStatusValue = (typeof STATUSES)[number];

function isStatus(v: string): v is BookingStatusValue {
  return (STATUSES as readonly string[]).includes(v);
}

export async function updateBookingStatus(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status") ?? "");
  if (Number.isInteger(id) && isStatus(status)) {
    await prisma.booking.update({ where: { id }, data: { status } }).catch(() => {});
  }
  redirect("/admin/bookings");
}
