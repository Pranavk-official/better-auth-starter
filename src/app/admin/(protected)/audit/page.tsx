import { AuditView } from "@/components/admin";

const AdminAuditPage = () => (
  <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
    <h1 className="text-2xl font-semibold">Audit log</h1>
    <AuditView />
  </div>
);

export default AdminAuditPage;
