import { getAdminSession } from "@/lib/helpers";
import { prisma } from "@/lib/prisma";
import { resolveAuditActors } from "@/lib/audit";
import type { AdminAuditData } from "@/lib/types";

export const GET = async () => {
  const session = await getAdminSession();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  const entries = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const data: AdminAuditData = {
    entries,
    actors: await resolveAuditActors(entries),
  };

  return Response.json(data);
};
