import { requireAdmin } from "@/lib/helpers";
import { AdminSidebar } from "@/components/admin";

const AdminProtectedLayout = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  await requireAdmin();

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
};

export default AdminProtectedLayout;
