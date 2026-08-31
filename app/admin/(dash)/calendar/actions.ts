"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { CALENDAR_TAG } from "@/lib/data/calendar";

/**
 * Dates the country closes that Tembera cannot work out for itself.
 *
 * Umuganda, the fixed public holidays, Good Friday and Umuganura are all
 * derived in lib/rwanda/calendar.ts. Eid al-Fitr and Eid al-Adha follow the
 * lunar calendar and are genuinely not derivable — guessing them would be
 * worse than asking. This is where somebody enters them.
 */

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
  const staff = await requireStaff();

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
  // admin typed rather than shifting it by the server's own timezone — the
  // column is a DATE, and a Kigali holiday is not an instant.
  const date = new Date(`${parsed.data.date}T00:00:00Z`);

  const created = await prisma.calendarDate
    .create({
      data: {
        date,
        name: parsed.data.name,
        effect: parsed.data.effect,
        note: parsed.data.note ?? "",
      },
    })
    .catch(() => null);

  if (!created) return { error: "That date and name are already on the calendar." };

  await recordAudit({
    actorId: staff.id,
    action: "calendar.create",
    entity: "calendarDate",
    entityId: String(created.id),
    meta: { date: parsed.data.date, name: parsed.data.name, effect: parsed.data.effect },
  });

  revalidateTag(CALENDAR_TAG);
  revalidatePath("/admin/calendar");
  return { ok: true };
}

export async function deleteCalendarDateAction(formData: FormData): Promise<void> {
  const staff = await requireStaff();

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  const removed = await prisma.calendarDate
    .delete({ where: { id }, select: { name: true, date: true } })
    .catch(() => null);
  if (!removed) return;

  await recordAudit({
    actorId: staff.id,
    action: "calendar.delete",
    entity: "calendarDate",
    entityId: String(id),
    meta: { name: removed.name, date: removed.date.toISOString().slice(0, 10) },
  });

  revalidateTag(CALENDAR_TAG);
  revalidatePath("/admin/calendar");
}
