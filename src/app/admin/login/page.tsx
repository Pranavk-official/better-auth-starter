import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/helpers";
import { AdminLoginForm } from "@/components/admin";

export default async function AdminLoginPage() {
  const session = await getServerSession();
  // Already an admin — send straight to the dashboard
  if (session && (session.user as { role?: string }).role === "admin") {
    redirect("/admin/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <AdminLoginForm />
    </div>
  );
}
