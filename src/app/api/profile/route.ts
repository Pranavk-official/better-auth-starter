import { getServerSession } from "@/lib/helpers";
import type { ProfileData } from "@/lib/types";

export const GET = async () => {
  const session = await getServerSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { user } = session;
  const data: ProfileData = {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image ?? null,
  };

  return Response.json(data);
};
