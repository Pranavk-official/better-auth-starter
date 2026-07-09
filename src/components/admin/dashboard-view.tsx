"use client";

import { useQuery } from "@tanstack/react-query";
import type { AdminDashboardData } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "./stat-card";
import { AuditList } from "./audit-list";

const fetchDashboard = async (): Promise<AdminDashboardData> => {
  const res = await fetch("/api/admin/dashboard");
  if (!res.ok) throw new Error("Failed to load dashboard");
  return res.json();
};

export const DashboardView = () => {
  const { data, error } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: fetchDashboard,
  });

  if (error) return <p className="text-sm text-destructive">{error.message}</p>;
  if (!data) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Live users" value={data.stats.liveUsers} hint="active sessions" />
        <StatCard label="Total users" value={data.stats.totalUsers} />
        <StatCard label="Admins" value={data.stats.admins} />
        <StatCard label="Banned" value={data.stats.banned} />
        <StatCard label="Verified" value={data.stats.verified} />
        <StatCard label="New (24h)" value={data.stats.newUsers24h} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          <AuditList entries={data.recent} actors={data.actors} />
        </CardContent>
      </Card>
    </div>
  );
};
