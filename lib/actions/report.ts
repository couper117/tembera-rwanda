"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  clientIp,
  formatRetryAfter,
  rateLimit,
} from "@/lib/rate-limit";
import { REPORT_KIND_VALUES } from "@/lib/reports/kinds";

// Reporting a wrong listing. Deliberately open to signed-out visitors: the
// person best placed to tell you a phone number is wrong is usually the
// business itself, and requiring them to create an account first would mean
// the correction never arrives.
//
// That openness is also why it is rate limited — it is a public write path.

const REPORT_PER_IP = { limit: 5, windowMs: 60 * 60 * 1000 };

const schema = z.object({
  placeId: z.string().min(1),
  kind: z.enum(REPORT_KIND_VALUES),
  body: z
    .string()
    .trim()
    .min(5, "Please tell us a little more about what's wrong.")
    .max(2000),
  contact: z.string().trim().max(200).optional(),
});

export interface ReportState {
  error?: string;
  ok?: boolean;
}

export async function submitReportAction(
  _prev: ReportState,
  formData: FormData,
): Promise<ReportState> {
  const ip = await clientIp();
  const throttled = rateLimit(
    `report:${ip}`,
    REPORT_PER_IP.limit,
    REPORT_PER_IP.windowMs,
  );
  if (!throttled.ok) {
    return {
      error: `Thanks — you've sent several reports already. Please try again in ${formatRetryAfter(throttled.retryAfter)}.`,
    };
  }

  const parsed = schema.safeParse({
    placeId: formData.get("placeId"),
    kind: formData.get("kind"),
    body: formData.get("body"),
    contact: formData.get("contact") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  // Confirm the place exists rather than trusting a posted id.
  const place = await prisma.place.findUnique({
    where: { id: parsed.data.placeId },
    select: { id: true },
  });
  if (!place) return { error: "That place no longer exists." };

  await prisma.report.create({
    data: {
      placeId: place.id,
      kind: parsed.data.kind,
      body: parsed.data.body,
      contact: parsed.data.contact ?? null,
    },
  });

  return { ok: true };
}
