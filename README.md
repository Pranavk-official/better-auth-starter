# better-auth-starter

A Next.js starter template with [Better Auth](https://better-auth.com), [Prisma](https://www.prisma.io/) ORM, PostgreSQL, 15 social login providers, and a fully containerised local development environment powered by [Docker Compose](https://docs.docker.com/compose/).

## Tech stack

- **Framework** — [Next.js 16](https://nextjs.org) (App Router, TypeScript)
- **Auth** — [Better Auth](https://better-auth.com) with email/password + 15 social providers
- **Styling** — [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) (base-ui)
- **ORM** — [Prisma 7](https://www.prisma.io) with PostgreSQL (via `@prisma/adapter-pg`)
- **Forms** — [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev)
- **Data fetching** — [TanStack React Query v5](https://tanstack.com/query)
- **Runtime / package manager** — [Bun](https://bun.sh)
- **Local infrastructure** — Docker Compose (PostgreSQL 16)

## Prerequisites

- [Bun](https://bun.sh) ≥ 1.0
- [Docker](https://www.docker.com) with the Compose plugin

## Quick start

### Option A — everything in Docker (recommended)

Runs both the Next.js dev server and PostgreSQL as containers with hot-reload via bind mounts.

```sh
# 1. Copy env file and fill in your secrets
cp .env.example .env
# At minimum set BETTER_AUTH_SECRET (see Environment variables below)

# 2. Start the full stack
docker compose -f docker-compose.dev.yml up --build
```

Open [http://localhost:3000](http://localhost:3000).

### Option B — only the database in Docker, app runs locally

```sh
# 1. Copy env and fill in your secrets
cp .env.example .env

# 2. Start only PostgreSQL
docker compose -f docker-compose.dev.yml up postgres -d

# 3. Install dependencies
bun install

# 4. Apply database migrations
bun run db:migrate

# 5. Start the dev server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Option C — production build (Docker)

`docker-compose.dev.yml` runs the hot-reload dev server. For a production-style run that **builds** the app and serves the compiled output, use `docker-compose.yml` + `Dockerfile`:

```sh
cp .env.example .env   # set BETTER_AUTH_SECRET + any providers

# Build the image and run the built app (next build → next start)
docker compose up --build
```

The container applies pending migrations (`db:deploy`) and then starts the production server. No source is bind-mounted (unlike dev), so rebuild the image to pick up code changes.

## Environment variables

Copy `.env.example` to `.env` and fill in the values.

```sh
cp .env.example .env
```

### Core variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/better_auth_starter?schema=public` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | — | **Required.** Secret key (≥ 32 chars). Generate with `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | `http://localhost:3000` | Base URL of the app (used to build OAuth callback URLs) |

> When running the full Docker Compose stack, the `app` service automatically overrides `DATABASE_URL` to use the `postgres` service hostname.

### Social provider variables

Fill in credentials only for the providers you want to enable. Remove or leave empty the ones you don't use.

Every OAuth app must set its callback URL to:

```
http://localhost:3000/api/auth/callback/<provider>
```

| Provider | Variables | Developer console |
|---|---|---|
| Apple | `APPLE_CLIENT_ID`, `APPLE_CLIENT_SECRET` | [developer.apple.com](https://developer.apple.com/) |
| Discord | `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` | [discord.com/developers](https://discord.com/developers/applications) |
| Dropbox | `DROPBOX_CLIENT_ID`, `DROPBOX_CLIENT_SECRET` | [dropbox.com/developers](https://www.dropbox.com/developers/apps) |
| Facebook | `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET` | [developers.facebook.com](https://developers.facebook.com/) |
| GitHub | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | [github.com/settings/developers](https://github.com/settings/developers) |
| GitLab | `GITLAB_CLIENT_ID`, `GITLAB_CLIENT_SECRET` | [gitlab.com/-/user_settings/applications](https://gitlab.com/-/user_settings/applications) |
| Google | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | [console.cloud.google.com](https://console.cloud.google.com/apis/credentials) |
| LinkedIn | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` | [linkedin.com/developers](https://www.linkedin.com/developers/apps) |
| Microsoft | `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` | [portal.azure.com](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps) |
| Reddit | `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET` | [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps) |
| Roblox | `ROBLOX_CLIENT_ID`, `ROBLOX_CLIENT_SECRET` | [create.roblox.com/dashboard/credentials](https://create.roblox.com/dashboard/credentials) |
| Spotify | `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET` | [developer.spotify.com](https://developer.spotify.com/dashboard) |
| TikTok | `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET` | [developers.tiktok.com](https://developers.tiktok.com/) |
| Twitch | `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET` | [dev.twitch.tv/console](https://dev.twitch.tv/console/apps) |
| Twitter / X | `TWITTER_CLIENT_ID`, `TWITTER_CLIENT_SECRET` | [developer.twitter.com](https://developer.twitter.com/en/portal/dashboard) |

## Authentication

### API route

All auth requests are handled by the catch-all route at `src/app/api/auth/[...all]/route.ts`. No additional configuration is needed.

### Server-side usage

```ts
import { getServerSession } from "@/lib/helpers";

// In a Server Component or Route Handler (deduplicates across layout + page)
const session = await getServerSession();
// session?.user   — the authenticated user
// session?.session — the session object
```

### Client-side usage

```tsx
import { useAuth } from "@/context/auth";
import { signIn, signOut } from "@/lib/auth-client";

// Session from context (provided by Providers in root layout)
const { session, isPending } = useAuth();

// Email / password
await signIn.email({ email, password, callbackURL: "/landing" });

// Social sign-in (Google is the primary provider)
await signIn.social({ provider: "google", callbackURL: "/landing" });

// Sign out
await signOut();
```

### API routes

Route handlers live in `src/app/api/<module>/route.ts`. Use them instead of server actions when you need to serve external clients, handle webhooks, stream responses, or control HTTP status/headers directly.

```ts
// src/app/api/example/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/helpers";

export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ user: session.user });
}
```

## Database scripts

```sh
bun run db:migrate        # create & apply a new migration (dev)
bun run db:migrate:deploy # apply migrations (CI / production)
bun run db:push           # push schema changes without a migration file
bun run db:generate       # regenerate the Prisma client
bun run db:studio         # open Prisma Studio in the browser
bun run db:seed           # run the seed script
```

## Project structure

```
better-auth-starter/
├── docker-compose.dev.yml
├── Dockerfile.dev
├── prisma/
│   ├── schema.prisma               # database schema
│   ├── generated/                  # auto-generated Prisma client (gitignored)
│   └── migrations/
├── prisma.config.ts
├── src/
│   ├── actions/
│   │   ├── profile/                # updateProfile server action
│   │   └── admin/                  # setUserRole, banUser, unbanUser, deleteUser
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── layout.tsx          # redirects to /landing if already logged in
│   │   │   └── login/page.tsx
│   │   ├── (public)/
│   │   │   ├── layout.tsx          # wraps with Navbar
│   │   │   └── landing/page.tsx
│   │   ├── (profile)/
│   │   │   ├── layout.tsx          # protected — redirects to /login if no session
│   │   │   ├── view/page.tsx
│   │   │   └── edit/page.tsx
│   │   ├── admin/(protected)/      # requireAdmin() layout + AdminSidebar
│   │   │   ├── page.tsx            # /admin dashboard (stats + recent activity)
│   │   │   ├── users/page.tsx      # manage users (role / ban / delete)
│   │   │   └── audit/page.tsx      # audit log
│   │   ├── api/
│   │   │   ├── admin/              # GET dashboard/users/audit (getAdminSession)
│   │   │   ├── profile/route.ts    # GET signed-in profile
│   │   │   └── auth/[...all]/route.ts  # Better Auth catch-all handler
│   │   ├── globals.css
│   │   ├── layout.tsx              # root layout — mounts Providers
│   │   └── page.tsx                # redirects to /landing
│   ├── components/
│   │   ├── admin/                  # sidebar, *-view (React Query), users-table, row-actions, stat-card, audit-list
│   │   ├── auth/                   # auth-form (tabs) + auth-modal, sign-in/up-form, google-button
│   │   ├── profile/                # profile-details (React Query) + edit-form
│   │   ├── shared/                 # navbar, providers + index.ts
│   │   └── ui/                     # shadcn/ui primitives + password-input
│   ├── context/
│   │   └── auth.tsx                # AuthProvider + useAuth() hook
│   └── lib/
│       ├── auth.ts                 # Better Auth server instance (+ login/signup audit hooks)
│       ├── auth-client.ts          # Better Auth React client
│       ├── audit.ts                # logAudit() append-only trail helpers
│       ├── helpers/                # getServerSession(), requireAdmin() + index.ts
│       ├── prisma.ts               # Prisma client singleton
│       ├── types/                  # shared Props/interfaces + ROLES const, by module
│       ├── utils.ts                # cn() utility
│       └── zod/                    # auth.zod.ts, profile.zod.ts, admin.zod.ts
└── .env.example
```

## Conventions

- **Arrow functions everywhere** — components (`export const Foo = () => ...`), handlers, helpers, and page/layout default exports (`const Page = () => ...; export default Page`). Generated shadcn/ui primitives keep their upstream style.
- **One component per file** — split sub-components (button, form, icon) into their own files under the module folder and re-export via `index.ts`.
- **Icons** — use [`react-icons`](https://react-icons.github.io/react-icons/) (e.g. `FcGoogle`, `LuEye`). No inline `<svg>` in feature code.
- **Types** — shared types and component `Props` live in `src/lib/types/<module>.ts`, re-exported from `src/lib/types/index.ts` (`@/lib/types`).
- **Type naming** — industry standard: interfaces are PascalCase with **no `I` prefix**; a component's props are `<Component>Props` (e.g. `AuthFormProps`). `interface` for object shapes, `type` for unions/aliases.
- **RBAC** — guard admin server components and server actions with `await requireAdmin()` from `@/lib/helpers`. Don't rely on the `(protected)` route group alone.
- **No Prisma in client bundles** — never import the Prisma client or its enum *values* into a `"use client"` component (it drags `node:async_hooks` into the browser and breaks the build). Import enum *types* only, or use the `ROLES` const from `@/lib/types`.
- **Lean on shadcn primitives** — `Button` (not raw `<button>`), `Table`, `Badge`, `Dialog` (content modals), `AlertDialog` (confirmations). Add missing ones with `bunx shadcn@latest add <name> --yes` (base-ui `base-nova` style); decline overwriting customized files. Confirmations use the shared `ConfirmDialog`, never `window.confirm`.

## Admin area & audit trail

- **Admin** lives at `/admin` behind `requireAdmin()`, with a collapsible shadcn-style `AdminSidebar`. `/admin` **is** the dashboard (index route); admins are sent there automatically on credential sign-in.
  - **Dashboard** (`/admin`) — live users (distinct non-expired sessions) + totals (users, admins, banned, verified, new-24h) and recent activity.
  - **Users** — promote/demote, ban/unban, delete via `@/actions/admin` server actions.
  - **Audit** — the event log.
- **Reads via API, writes via actions** — admin/profile pages fetch GET route handlers (`api/admin/*`, `api/profile`) with React Query; mutations are server actions and the client invalidates the query key afterward.
- **Sign out always confirms** (shared `SignOutConfirm` dialog) and is available to every signed-in user from the avatar menu. That menu is role-aware: admins get an "Admin dashboard" link, others get profile links.
- **Audit trail** — `logAudit()` (`@/lib/audit`) appends to the `AuditLog` table. Login, logout, and signup are captured automatically via Better Auth `databaseHooks` in `auth.ts`; profile updates and every admin mutation are logged explicitly. Bootstrap an admin with `bun run db:seed` or `bun run make:admin <email>`.

## Path aliases

| Alias | Resolves to |
|---|---|
| `@/*` | `src/*` |
| `@prisma/*` | `prisma/*` |

## Adding a database model

1. Add the model to `prisma/schema.prisma`.
2. Run `bun run db:migrate` to create a migration and regenerate the client.
3. Import the client in your code:

```ts
import { prisma } from "@/lib/prisma";
```

## Agent customization

Agent instructions live in [AGENTS.md](./AGENTS.md). Reusable skills live in `.agents/skills/`.

| Skill | What it does | Invoke |
|-------|-------------|--------|
| [caveman](.agents/skills/caveman/README.md) | Compresses model responses ~65% by speaking like a caveman. Full technical accuracy preserved. Six intensity levels: `lite`, `full` (default), `ultra`, `wenyan-lite`, `wenyan-full`, `wenyan-ultra`. | `/caveman`, `/caveman lite`, `/caveman ultra`, `stop caveman` |

## Recreating from scratch

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for a full step-by-step walkthrough.
