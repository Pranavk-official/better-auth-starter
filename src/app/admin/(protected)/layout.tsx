import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/helpers";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session) redirect("/login?redirect=/admin/dashboard");
  if ((session.user as { role?: string }).role !== "admin") redirect("/landing");

  return <>{children}</>;
}
