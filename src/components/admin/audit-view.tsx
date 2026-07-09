"use client";

import { useQuery } from "@tanstack/react-query";
import type { AdminAuditData } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuditList } from "./audit-list";

const fetchAudit = async (): Promise<AdminAuditData> => {
  const res = await fetch("/api/admin/audit");
  if (!res.ok) throw new Error("Failed to load audit log");
  return res.json();
};

export const AuditView = () => {
  const { data, error } = useQuery({
    queryKey: ["admin", "audit"],
    queryFn: fetchAudit,
  });

  if (error) return <p className="text-sm text-destructive">{error.message}</p>;
  if (!data) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Last {data.entries.length} events</CardTitle>
      </CardHeader>
      <CardContent>
        <AuditList entries={data.entries} actors={data.actors} />
      </CardContent>
    </Card>
  );
};
