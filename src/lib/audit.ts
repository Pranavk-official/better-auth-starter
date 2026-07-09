import "server-only";
import { headers } from "next/headers";
import { AuditAction, type Prisma } from "@prisma/generated/client";
import { prisma } from "@/lib/prisma";

export { AuditAction };

export interface LogAuditInput {
  action: AuditAction;
  /** Who performed the action (null = system/self-service). */
  actorId?: string | null;
  /** The user affected by the action, if any. */
  targetId?: string | null;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Append an audit entry. Best-effort: logging must never break the request
 * that triggered it, so failures are swallowed.
 */
export const logAudit = async (input: LogAuditInput): Promise<void> => {
  try {
    await prisma.auditLog.create({ data: input });
  } catch {
    // swallow — audit logging is non-critical
  }
};

/** Map the actor/target ids referenced by a set of entries to display names. */
export const resolveAuditActors = async (
  entries: { actorId?: string | null; targetId?: string | null }[],
): Promise<Record<string, string>> => {
  const ids = [
    ...new Set(
      entries.flatMap((e) => [e.actorId, e.targetId]).filter(Boolean) as string[],
    ),
  ];
  if (ids.length === 0) return {};
  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, email: true },
  });
  return Object.fromEntries(users.map((u) => [u.id, u.name || u.email]));
};

/** Pull the caller's IP + user-agent from the incoming request headers. */
export const requestMeta = async (): Promise<{
  ipAddress: string | null;
  userAgent: string | null;
}> => {
  const h = await headers();
  return {
    ipAddress: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: h.get("user-agent") ?? null,
  };
};
