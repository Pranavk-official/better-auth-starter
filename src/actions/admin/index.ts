"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/helpers";
import { AuditAction, logAudit, requestMeta } from "@/lib/audit";
import {
  banUserSchema,
  setRoleSchema,
  userIdSchema,
} from "@/lib/zod/admin.zod";

// Reads go through GET /api/admin/*; the client invalidates its React Query
// cache after these mutations, so no revalidatePath is needed here.

export const setUserRole = async (input: unknown) => {
  const { user } = await requireAdmin();
  const { userId, role } = setRoleSchema.parse(input);
  if (userId === user.id) throw new Error("You can't change your own role.");

  await auth.api.setRole({ headers: await headers(), body: { userId, role } });
  await logAudit({
    action: AuditAction.user_role_changed,
    actorId: user.id,
    targetId: userId,
    metadata: { role },
    ...(await requestMeta()),
  });
};

export const banUser = async (input: unknown) => {
  const { user } = await requireAdmin();
  const { userId, banReason } = banUserSchema.parse(input);
  if (userId === user.id) throw new Error("You can't ban your own account.");

  await auth.api.banUser({
    headers: await headers(),
    body: { userId, banReason },
  });
  await logAudit({
    action: AuditAction.user_banned,
    actorId: user.id,
    targetId: userId,
    ...(banReason ? { metadata: { banReason } } : {}),
    ...(await requestMeta()),
  });
};

export const unbanUser = async (input: unknown) => {
  const { user } = await requireAdmin();
  const { userId } = userIdSchema.parse(input);

  await auth.api.unbanUser({ headers: await headers(), body: { userId } });
  await logAudit({
    action: AuditAction.user_unbanned,
    actorId: user.id,
    targetId: userId,
    ...(await requestMeta()),
  });
};

export const deleteUser = async (input: unknown) => {
  const { user } = await requireAdmin();
  const { userId } = userIdSchema.parse(input);
  if (userId === user.id) throw new Error("You can't delete your own account.");

  await auth.api.removeUser({ headers: await headers(), body: { userId } });
  await logAudit({
    action: AuditAction.user_deleted,
    actorId: user.id,
    targetId: userId,
    ...(await requestMeta()),
  });
};
