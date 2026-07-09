import { ROLES, type UsersTableProps } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserRowActions } from "./user-row-actions";

export const UsersTable = ({ users, currentUserId }: UsersTableProps) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>User</TableHead>
        <TableHead>Role</TableHead>
        <TableHead>Status</TableHead>
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {users.map((u) => (
        <TableRow key={u.id}>
          <TableCell>
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={u.image ?? undefined} alt={u.name} />
                <AvatarFallback>
                  {(u.name?.[0] ?? u.email[0]).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {u.name}
                  {u.id === currentUserId && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      (you)
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {u.email}
                  {u.username ? ` · @${u.username}` : ""}
                </p>
              </div>
            </div>
          </TableCell>
          <TableCell>
            <Badge variant={u.role === ROLES.admin ? "default" : "secondary"}>
              {u.role}
            </Badge>
          </TableCell>
          <TableCell>
            <div className="flex flex-wrap gap-1.5">
              {u.banned && <Badge variant="destructive">banned</Badge>}
              {!u.emailVerified && <Badge variant="outline">unverified</Badge>}
              {!u.banned && u.emailVerified && (
                <span className="text-xs text-muted-foreground">active</span>
              )}
            </div>
          </TableCell>
          <TableCell className="text-right">
            <UserRowActions user={u} disabled={u.id === currentUserId} />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);
