import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export const SETTINGS_TAG = "settings";

/**
 * Deployment settings an administrator can change without a deploy.
 *
 * Deliberately a closed set with defaults in code. A key/value table with no
 * schema invites a hundred half-remembered keys nobody dares delete; declaring
 * them here means an unknown key is simply ignored, and every reader gets a
 * typed object with a sensible value even on a database that has never been
 * written to.
 */
export interface Settings {
  orgName: string;
  orgContact: string;
  orgBlurb: string;
}

export const SETTING_DEFAULTS: Settings = {
  orgName: "Tembera Rwanda",
  orgContact: "",
  orgBlurb: "The official guide to places across Rwanda.",
};

export const SETTING_KEYS = Object.keys(SETTING_DEFAULTS) as (keyof Settings)[];

export const getSettings = unstable_cache(
  async (): Promise<Settings> => {
    const rows = await prisma.setting.findMany({
      where: { key: { in: SETTING_KEYS } },
      select: { key: true, value: true },
    });
    const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return { ...SETTING_DEFAULTS, ...stored } as Settings;
  },
  ["settings"],
  { tags: [SETTINGS_TAG] },
);
