"use server";

import { revalidateTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { SETTINGS_TAG, getSettings } from "@/lib/data/settings";

export interface SettingsState {
  error?: string;
  ok?: boolean;
}

const schema = z.object({
  orgName: z.string().trim().min(1, "The organisation needs a name.").max(120),
  // Optional, but must be an address if given: this one is printed on the
  // privacy page as the way to reach somebody about their data, so a typo
  // here is a legal problem rather than a cosmetic one.
  orgContact: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .or(z.literal(""))
    .default(""),
  orgBlurb: z.string().trim().max(400),
});

export async function updateSettingsAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const admin = await requireAdmin();

  const parsed = schema.safeParse({
    orgName: formData.get("orgName"),
    orgContact: formData.get("orgContact"),
    orgBlurb: formData.get("orgBlurb"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const before = await getSettings();

  await prisma.$transaction(
    Object.entries(parsed.data).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      }),
    ),
  );

  const changed = Object.fromEntries(
    Object.entries(parsed.data).filter(
      ([key, value]) => before[key as keyof typeof before] !== value,
    ),
  );

  if (Object.keys(changed).length > 0) {
    await recordAudit({
      actorId: admin.id,
      action: "settings.update",
      entity: "settings",
      entityId: "site",
      meta: changed,
    });
  }

  revalidateTag(SETTINGS_TAG);
  return { ok: true };
}
