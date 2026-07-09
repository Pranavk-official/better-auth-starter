import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/generated/client";
import { auth } from "@/lib/auth";

// ponytail: cache() deduplicates across layout + page in the same request
export const getServerSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

/** Session user augmented with the admin-plugin fields. */
type AuthedUser = { role?: UserRole | null; banned?: boolean | null };

/**
 * Guard for admin-only server components and server actions. Redirects anyone
 * who isn't a signed-in, non-banned admin — so code after the call is
 * guaranteed to run for an admin. Call it in every admin page/action; don't
 * rely on the route group alone.
 */
export const requireAdmin = cache(async () => {
  const session = await getServerSession();
  if (!session) redirect("/login?redirect=/admin");

  const user = session.user as typeof session.user & AuthedUser;
  if (user.banned) redirect("/login");
  if (user.role !== UserRole.admin) redirect("/");

  return session;
});

/**
 * Non-redirecting admin check for **API route handlers** — returns the session
 * for a signed-in, non-banned admin, or `null` (the handler replies 401/403).
 */
export const getAdminSession = cache(async () => {
  const session = await getServerSession();
  if (!session) return null;
  const user = session.user as typeof session.user & AuthedUser;
  if (user.banned || user.role !== UserRole.admin) return null;
  return session;
});
