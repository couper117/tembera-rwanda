"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { CALENDAR_TAG } from "@/lib/data/calendar";

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use the date picker."),
  name: z.string().trim().min(2, "Give the day a name.").max(120),
  effect: z.enum(["closed", "closed-morning", "reduced"]),
  note: z.string().trim().max(400).optional(),
});

export interface CalendarState {
  error?: string;
  ok?: boolean;
}

export async function addCalendarDateAction(
  _prev: CalendarState,
  formData: FormData,
): Promise<CalendarState> {
  await requireAdmin();

  const parsed = schema.safeParse({
    date: formData.get("date"),
    name: formData.get("name"),
    effect: formData.get("effect"),
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  // Stored as a plain calendar date. Parsing as UTC midnight keeps the day the
  // admin typed, rather than shifting it by the server's own timezone.
  const date = new Date(`${parsed.data.date}T00:00:00Z`);

  try {
    await prisma.calendarDate.create({
      data: {
        date,
        name: parsed.data.name,
        effect: parsed.data.effect,
        note: parsed.data.note ?? "",
      },
    });
  } catch {
    return { error: "That date and name are already on the calendar." };
  }

  revalidateTag(CALENDAR_TAG);
  revalidatePath("/admin/calendar");
  return { ok: true };
}

export async function deleteCalendarDateAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  await prisma.calendarDate.delete({ where: { id } }).catch(() => {});
  revalidateTag(CALENDAR_TAG);
  revalidatePath("/admin/calendar");
}
