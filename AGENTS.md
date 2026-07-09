<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:project-rules -->
## Project context

This is **better-auth-starter** — a Next.js 16 (App Router) starter with Better Auth, Prisma 7 + PostgreSQL, 15 social login providers, and a bun-only toolchain.

## Package manager

- **Always use `bun` / `bunx`**. Never suggest or run `npm`, `npx`, `pnpm`, or `yarn` commands.
- Install packages: `bun add <pkg>` (runtime) or `bun add -D <pkg>` (dev).
- Run scripts: `bun run <script>`.
- Execute one-off CLIs: `bunx <cli>`.

## Prisma

- Schema lives in `prisma/schema.prisma`. Prisma CLI config is in `prisma.config.ts`.
- The generated client is output to `prisma/generated/` — **this directory is gitignored**. Always run `bun run db:generate` after pulling schema changes.
- **Prisma 7 requires a driver adapter.** The singleton in `src/lib/prisma.ts` creates a `pg.Pool` and wraps it with `PrismaPg` from `@prisma/adapter-pg`. Never call `new PrismaClient()` without the `adapter` option.
- Import the Prisma singleton (never instantiate `PrismaClient` directly in application code):
  ```ts
  import { prisma } from "@/lib/prisma";
  ```
- Import types from the generated client path:
  ```ts
  import type { User } from "@prisma/generated/client";
  ```
- After editing the schema run `bun run db:migrate` (dev) or `bun run db:migrate:deploy` (prod/CI).
- Never run raw `prisma` commands — always go through the `bun run db:*` scripts defined in `package.json`.

## Docker / local dev

- `docker-compose.dev.yml` manages two services: `postgres` (PostgreSQL 16) and `app` (Next.js).
- Bring everything up: `docker compose -f docker-compose.dev.yml up --build`.
- The `app` container automatically injects `DATABASE_URL` with the `postgres` service hostname; `.env` uses `localhost` for running the app outside Docker.
- Port mappings: app → `3000`, postgres → `5432`.

## Better Auth

- Server instance lives in `src/lib/auth.ts` — export is named `auth`.
- React client lives in `src/lib/auth-client.ts` — export is named `authClient` with individual method exports (`signIn`, `signOut`, `signUp`, `useSession`, `getSession`).
- The catch-all API route is `src/app/api/auth/[...all]/route.ts`.
- Session types are exported from `src/lib/auth.ts` as `Session` and `User`.
- To get the session server-side: use `getServerSession()` from `@/lib/helpers` (wraps `auth.api.getSession` with React `cache()` for deduplication).
- To sign in client-side: `authClient.signIn.social({ provider: "<id>" })` or `authClient.signIn.email({ email, password })`.
- When adding a new social provider, add it to the `socialProviders` block in `src/lib/auth.ts` and document the env vars in `.env.example`.

## Code conventions

- All source files live under `src/`.
- Path alias `@/*` resolves to `src/*`. Path alias `@prisma/*` resolves to `prisma/*`.
- Tailwind CSS v4 is used — no `tailwind.config.*` file; configuration lives in `globals.css`.
- shadcn/ui components use `@base-ui/react` (not Radix). Use `render` prop for polymorphism instead of `asChild`.
- **Prefer shadcn primitives over hand-rolled markup.** Add missing ones with `bunx shadcn@latest add <name> --yes` (the `components.json` style is `base-nova`, so it generates base-ui variants). When it prompts to overwrite a customized primitive (e.g. `button.tsx`), answer **no**. Use `Button` for clickable things (not raw `<button>`), `Table` for tabular data, `Badge` for status pills, `Dialog` for content modals, and `AlertDialog` for confirmations.
- **Confirmations use the shared `ConfirmDialog`** (`@/components/shared`, built on `AlertDialog`) — never `window.confirm`. Destructive actions (delete user, sign out) pass `destructive` + a `pending` flag. Sign-out specifically goes through `SignOutConfirm`, which wraps `ConfirmDialog`.
- React Query (`@tanstack/react-query`) is set up via `Providers` in `src/components/shared/providers.tsx`. Use `useMutation` for server action calls.
- Auth context is in `src/context/auth.tsx` — use `useAuth()` in client components instead of calling `useSession` directly.
- Zod validation schemas live in `src/lib/zod/<module>.zod.ts`.
- Server actions live in `src/actions/<module>/index.ts`.
- API route handlers live in `src/app/api/<module>/route.ts`. Use route handlers (not server actions) for: endpoints consumed by external clients, webhooks, file uploads, streaming responses, or when you need full control over the HTTP response. Always verify the session inside every route handler — they are reachable via direct HTTP requests.
- Shared components live in `src/components/shared/`, module components in `src/components/<module>/`. Both export through `index.ts`.
- **Use arrow functions**, not `function` declarations — for components (`export const Foo = () => ...`), handlers, and helpers. Page/layout files: `const Page = () => ...` then `export default Page`. Exception: shadcn/ui primitives in `src/components/ui/` that are generated by the shadcn CLI keep their upstream style.
- **One component per file.** When a component grows sub-components (icon, button, panel, form), split each into its own file under the same module folder and re-export via `index.ts`. Don't nest multiple exported components in one file.
- **Icons: use `react-icons`** (e.g. `import { FcGoogle } from "react-icons/fc"`). No inline `<svg>`, no other icon libraries in feature code. shadcn/ui primitives may keep the `lucide-react` icons they ship with, or use `react-icons/lu`.
- Route groups: `(auth)` for login/auth pages, `(public)` for unauthenticated-accessible pages, `(profile)` for protected profile pages.
- Admin area lives at `src/app/admin/`; protected pages inside `admin/(protected)/`. Unauthenticated/non-admin users are sent to the shared `/login` (there is no separate admin login page).
- **RBAC:** guard every admin server component / server action with `await requireAdmin()` from `@/lib/helpers` (checks signed-in + `role === UserRole.admin` + not banned, using the Prisma `UserRole` enum — never a magic `"admin"` string). Don't rely on the `(protected)` route group alone; a route placed outside it would be unguarded.
- Admin area pages: `admin/(protected)` = the dashboard at **`/admin`** (index; there is no `/admin/dashboard`), plus `admin/(protected)/users` and `admin/(protected)/audit`. The protected layout renders `AdminSidebar` (a hand-rolled shadcn-style left sidebar — the official shadcn sidebar block isn't in the base-ui registry, same as `tabs`/`dialog`).
- **Reads vs writes:** admin + profile pages **read** through GET route handlers (`api/admin/dashboard|users|audit`, `api/profile`), consumed by thin client components with React Query (`useQuery`). Route handlers guard with `getAdminSession()` (admin) or `getServerSession()` (profile) and return 401/403 — never redirect. **Writes** stay server actions; after a mutation the client `invalidateQueries` the relevant key (`["admin"]`, `["profile"]`) rather than `revalidatePath`.
- Admin components live in `src/components/admin/` and export through `index.ts`. `AdminSidebar` is collapsible (icon-only). `/admin` redirects to `/admin/dashboard`, and credential sign-in routes admins to `/admin/dashboard` (non-admins to their `redirectTo`).
- Signing out **always confirms first** via the shared `SignOutConfirm` dialog (`@/components/shared`) — used by both the navbar avatar menu and the admin sidebar. Don't call `signOut()` directly from a button. The navbar avatar menu is role-aware: admins see an "Admin dashboard" link, everyone else sees profile links — and **every** signed-in user gets a "Sign out" entry.
- Admin mutations are **server actions** in `src/actions/admin/` (`setUserRole`, `banUser`, `unbanUser`, `deleteUser`). Each `await requireAdmin()`, validates with a `*.zod.ts` schema, calls the Better Auth admin API (`auth.api.setRole` / `banUser` / `unbanUser` / `removeUser`), writes an audit entry, and `revalidatePath`s the admin routes. Never let an admin act on their own account (self-ban/-delete/-demote are rejected).
- **Audit trail:** append events with `logAudit()` from `@/lib/audit` (best-effort — it swallows errors so it can't break the request). Login/logout/signup are logged automatically via `databaseHooks` in `auth.ts` (logout = the `session.delete` hook, so admin session-revoke and expiry count too); log every admin mutation and sensitive user action explicitly. The `AuditLog` table is append-only and stores actor/target as plain ids (survives user deletion). New action → add it to the `AuditAction` enum in `schema.prisma`.
- **Never import the Prisma client — or its enum _values_ (`UserRole`, `AuditAction`) — into a `"use client"` component.** It pulls the Prisma runtime (`node:async_hooks`) into the browser bundle and breaks the whole build. Import enum **types** only (erased at compile time), or use the client-safe `ROLES` const from `@/lib/types` for role literals. Server actions are safe to import into client components (they compile to RPC stubs).
- TypeScript strict mode is enabled. Do not use `any` unless absolutely unavoidable.
- **Shared types live in `src/lib/types/<module>.ts`** and re-export through `src/lib/types/index.ts`; import via `@/lib/types`. Put a component's `Props` type there (not inline) once it has more than a trivial shape.
- **Type naming (industry standard, no Hungarian prefixes):** interfaces are PascalCase with **no `I` prefix** (`AuthTab`, `SessionUser`). A component's props interface is named `<Component>Props` (`AuthFormProps`, `GoogleButtonProps`). Use `interface` for object shapes; use `type` for unions / primitive aliases (`type AuthTab = "signin" | "signup"`).
- Do not add `console.log` statements to committed code.
<!-- END:project-rules -->

<!-- BEGIN:skills -->
## Skills

Reusable behaviour packs live in `.agents/skills/<name>/SKILL.md`. Load the relevant file with `read_file` when the trigger fires — do not guess the rules from the README.

| Skill | Trigger | Path |
|-------|---------|------|
| **caveman** | User says "caveman mode", "talk like caveman", "use caveman", "less tokens", "be brief", or types `/caveman` | `.agents/skills/caveman/SKILL.md` |
<!-- END:skills -->
