import { UserRole } from "@prisma/generated/client";
import { getAdminSession } from "@/lib/helpers";
import { prisma } from "@/lib/prisma";
import { resolveAuditActors } from "@/lib/audit";
import type { AdminDashboardData } from "@/lib/types";

const DAY_MS = 24 * 60 * 60 * 1000;

export const GET = async () => {
  const session = await getAdminSession();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  const now = new Date();
  const dayAgo = new Date(now.getTime() - DAY_MS);

  const [totalUsers, admins, banned, verified, newUsers24h, liveSessions, recent] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: UserRole.admin } }),
      prisma.user.count({ where: { banned: true } }),
      prisma.user.count({ where: { emailVerified: true } }),
      prisma.user.count({ where: { createdAt: { gte: dayAgo } } }),
      prisma.session.findMany({
        where: { expiresAt: { gt: now } },
        distinct: ["userId"],
        select: { userId: true },
      }),
      prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    ]);

  const data: AdminDashboardData = {
    stats: {
      liveUsers: liveSessions.length,
      totalUsers,
      admins,
      banned,
      verified,
      newUsers24h,
    },
    recent,
    actors: await resolveAuditActors(recent),
  };

  return Response.json(data);
};
