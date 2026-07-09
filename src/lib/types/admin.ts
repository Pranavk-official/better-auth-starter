import type { AuditAction, UserRole } from "@prisma/generated/client";

/**
 * Role values usable in **client** components — importing Prisma's `UserRole`
 * enum *value* there would drag the whole client runtime (node:async_hooks) into
 * the browser bundle. `satisfies Record<Role, Role>` makes the compiler fail if
 * the Prisma enum and this mirror ever drift.
 */
export type Role = UserRole;
export const ROLES = {
  user: "user",
  admin: "admin",
} as const satisfies Record<Role, Role>;

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  username?: string | null;
  role: UserRole;
  banned: boolean;
  emailVerified: boolean;
  createdAt: Date | string;
}

export interface AdminStats {
  liveUsers: number;
  totalUsers: number;
  admins: number;
  banned: number;
  verified: number;
  newUsers24h: number;
}

export interface AuditEntry {
  id: string;
  action: AuditAction;
  actorId?: string | null;
  targetId?: string | null;
  metadata?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date | string;
}

export interface StatCardProps {
  label: string;
  value: number | string;
  hint?: string;
}

export interface UsersTableProps {
  users: AdminUserRow[];
  currentUserId: string;
}

export interface UserRowActionsProps {
  user: AdminUserRow;
  /** Disable actions the admin can't take on their own account. */
  disabled: boolean;
}

export interface AuditListProps {
  entries: AuditEntry[];
  /** userId → display label, for rendering actor/target names. */
  actors?: Record<string, string>;
}

// ── API response shapes (GET /api/admin/*) ──────────────────────────────────

export interface AdminDashboardData {
  stats: AdminStats;
  recent: AuditEntry[];
  actors: Record<string, string>;
}

export interface AdminAuditData {
  entries: AuditEntry[];
  actors: Record<string, string>;
}
