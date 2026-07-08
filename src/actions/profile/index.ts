"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { profileSchema } from "@/lib/zod/profile.zod";

export async function updateProfile(input: unknown) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const { name, image } = profileSchema.parse(input);

  await auth.api.updateUser({
    headers: await headers(),
    body: { name, image: image?.trim() || undefined },
  });

  revalidatePath("/profile/view");
}
