"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/auth";
import type { AdminUserRow } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersTable } from "./users-table";

const fetchUsers = async (): Promise<AdminUserRow[]> => {
  const res = await fetch("/api/admin/users");
  if (!res.ok) throw new Error("Failed to load users");
  return res.json();
};

export const UsersView = () => {
  const { session } = useAuth();
  const { data, error } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: fetchUsers,
  });

  if (error) return <p className="text-sm text-destructive">{error.message}</p>;
  if (!data) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>All users ({data.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <UsersTable users={data} currentUserId={session?.user.id ?? ""} />
      </CardContent>
    </Card>
  );
};
