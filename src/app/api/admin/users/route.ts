import { getAdminSession } from "@/lib/helpers";
import { prisma } from "@/lib/prisma";
import type { AdminUserRow } from "@/lib/types";

export const GET = async () => {
  const session = await getAdminSession();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  const users: AdminUserRow[] = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      username: true,
      role: true,
      banned: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  return Response.json(users);
};
