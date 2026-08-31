import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/**
 * Record an administrative action.
 *
 * Called by every write in the dashboard. Two rules make this worth having
 * rather than merely present:
 *
 *   - **It never throws.** An audit failure must not roll back the change the
 *     user asked for, or turn a working edit into an error they cannot act on.
 *     A dropped audit row is a smaller problem than an admin who cannot edit.
 *   - **It is append-only.** Nothing in the application updates or deletes
 *     these rows. An audit trail that can be edited is worse than none: it
 *     invites a trust it has not earned.
 *
 * Call it AFTER the write succeeds, so the log records what happened rather
 * than what was attempted.
 */
export async function recordAudit(entry: {
  actorId: number | null;
  /** Conventionally "<entity>.<verb>": "place.update", "review.hide". */
  action: string;
  entity: string;
  entityId: string;
  /** Small. What changed, not the whole record. */
  meta?: Prisma.InputJsonValue;
}): Promise<void> {
  try {
    await prisma.auditEvent.create({
      data: {
        actorId: entry.actorId,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        meta: entry.meta,
      },
    });
  } catch (error) {
    // Deliberately swallowed — see above. Logged so it is not invisible.
    console.error("[audit] failed to record", entry.action, error);
  }
}

export interface AuditRow {
  id: number;
  action: string;
  entity: string;
  entityId: string;
  meta: Prisma.JsonValue;
  createdAt: Date;
  actor: { name: string; email: string } | null;
}

/** The most recent events, newest first, optionally for one record. */
export async function recentAudit(options: {
  entity?: string;
  entityId?: string;
  take?: number;
} = {}): Promise<AuditRow[]> {
  const { entity, entityId, take = 50 } = options;
  return prisma.auditEvent.findMany({
    where: {
      ...(entity ? { entity } : {}),
      ...(entityId ? { entityId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      action: true,
      entity: true,
      entityId: true,
      meta: true,
      createdAt: true,
      actor: { select: { name: true, email: true } },
    },
  });
}
