"use server";

import { z } from "zod";
import { READ_ONLY_MESSAGE } from "@/lib/admin/readonly";

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
  const parsed = schema.safeParse({
    date: formData.get("date"),
    name: formData.get("name"),
    effect: formData.get("effect"),
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }
  return { error: READ_ONLY_MESSAGE };
}

export async function deleteCalendarDateAction(_formData: FormData): Promise<void> {
  // No store to delete from. Kept so the row's delete button stays wired.
}
