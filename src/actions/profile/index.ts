"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { AuditAction, logAudit, requestMeta } from "@/lib/audit";
import { profileSchema } from "@/lib/zod/profile.zod";

export const updateProfile = async (input: unknown) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const { name, image } = profileSchema.parse(input);

  await auth.api.updateUser({
    headers: await headers(),
    body: { name, image: image?.trim() || undefined },
  });

  await logAudit({
    action: AuditAction.profile_updated,
    actorId: session.user.id,
    targetId: session.user.id,
    ...(await requestMeta()),
  });

  revalidatePath("/profile/view");
};
