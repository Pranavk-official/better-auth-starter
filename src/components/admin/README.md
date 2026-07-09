# `src/components/admin/`

Components for the admin area
([`app/admin/(protected)/`](../../app)). Exported via `index.ts`.

| Component | Role |
|-----------|------|
| `AdminSidebar` | Collapsible (icon-only) left nav — Dashboard (`/admin`) / Users / Audit with active-link state + confirmed sign out. Client (`usePathname`). |
| `DashboardView` / `UsersView` / `AuditView` | Client views that fetch `GET /api/admin/*` with React Query and render the pieces below. The pages just render these. |
| `StatCard` | Single dashboard metric (label + value + hint); shadcn `Card`. |
| `UsersTable` | User list as a shadcn `Table` with `Badge` role/status pills; server component. |
| `UserRowActions` | Per-user kebab menu (`Button` trigger) — promote/demote, ban/unban, delete. Client; calls `@/actions/admin` and confirms delete with the shared `ConfirmDialog`. |
| `AuditList` | Audit entries as a shadcn `Table` (event `Badge`, actor → target, time). |

## Notes

- There is **no admin login form** — admins authenticate through the unified
  `/login` page. Authorization is enforced by `await requireAdmin()` in
  `app/admin/(protected)/layout.tsx` **and** re-checked inside every admin
  server action; any new **API route** must re-check it too.
- The sidebar is hand-rolled in shadcn style — the official shadcn sidebar block
  isn't in the base-ui registry (same as `ui/tabs` and `ui/dialog`).
- `UserRowActions` is `"use client"`, so it uses the `ROLES` const from
  `@/lib/types` (never the Prisma `UserRole` value — that would leak the Prisma
  runtime into the browser bundle).
