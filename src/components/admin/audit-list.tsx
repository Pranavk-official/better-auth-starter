import type { AuditEntry, AuditListProps } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Keyed by the raw action string (no Prisma enum import — this component ends up
// in the client bundle, and the Prisma runtime must never go there).
const LABELS: Record<string, string> = {
  login: "Signed in",
  logout: "Signed out",
  signup: "Signed up",
  profile_updated: "Updated profile",
  user_role_changed: "Changed role",
  user_banned: "Banned user",
  user_unbanned: "Unbanned user",
  user_deleted: "Deleted user",
};

const name = (id: string | null | undefined, actors: Record<string, string>) =>
  id ? actors[id] ?? id : "system";

export const AuditList = ({ entries, actors = {} }: AuditListProps) => {
  if (entries.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No activity yet.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Event</TableHead>
          <TableHead>By</TableHead>
          <TableHead>Target</TableHead>
          <TableHead className="text-right">When</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((e: AuditEntry) => {
          const hasTarget = e.targetId && e.targetId !== e.actorId;
          return (
            <TableRow key={e.id}>
              <TableCell>
                <Badge variant="secondary">{LABELS[e.action] ?? e.action}</Badge>
              </TableCell>
              <TableCell className="text-sm">{name(e.actorId, actors)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {hasTarget ? name(e.targetId, actors) : "—"}
              </TableCell>
              <TableCell className="text-right text-xs text-muted-foreground">
                {new Date(e.createdAt).toLocaleString()}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};
