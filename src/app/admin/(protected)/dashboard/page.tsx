import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getServerSession } from "@/lib/helpers";
import { signOut } from "@/lib/auth-client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AdminSignOutButton } from "@/components/admin";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role?: string;
  username?: string | null;
};

export default async function AdminDashboardPage() {
  const session = await getServerSession();
  if (!session) return null;

  const { users } = await auth.api.listUsers({
    headers: await headers(),
    query: { limit: 50 },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <AdminSignOutButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {users.map((u) => {
              const user = u as AdminUser;
              return (
                <div key={user.id} className="flex items-center gap-3 py-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.image ?? undefined} />
                    <AvatarFallback>
                      {(user.name?.[0] ?? user.email[0]).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                      {user.username ? ` · @${user.username}` : ""}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {user.role ?? "user"}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
