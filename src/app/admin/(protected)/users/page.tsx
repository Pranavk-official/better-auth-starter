import { UsersView } from "@/components/admin";

const AdminUsersPage = () => (
  <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
    <h1 className="text-2xl font-semibold">Users</h1>
    <UsersView />
  </div>
);

export default AdminUsersPage;
