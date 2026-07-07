# better-auth-starter

A Next.js starter template with [Better Auth](https://better-auth.com), [Prisma](https://www.prisma.io/) ORM, PostgreSQL, 15 social login providers, and a fully containerised local development environment powered by [Docker Compose](https://docs.docker.com/compose/).

## Tech stack

- **Framework** — [Next.js 16](https://nextjs.org) (App Router, TypeScript)
- **Auth** — [Better Auth](https://better-auth.com) with email/password + 15 social providers
- **Styling** — [Tailwind CSS v4](https://tailwindcss.com)
- **ORM** — [Prisma 7](https://www.prisma.io) with PostgreSQL (via `@prisma/adapter-pg`)
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
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Get the current session in a Server Component or Route Handler
const session = await auth.api.getSession({ headers: await headers() });
// session.user   — the authenticated user (or null)
// session.session — the session object (or null)
```

### Client-side usage

```tsx
import { authClient } from "@/lib/auth-client";

// Email / password
await authClient.signUp.email({ email, password, name });
await authClient.signIn.email({ email, password });

// Social sign-in (replace "github" with any configured provider)
await authClient.signIn.social({ provider: "github" });

// Sign out
await authClient.signOut();

// React hook — re-renders when session changes
const { data: session, isPending } = authClient.useSession();
```

### Exported types

```ts
import type { Session, User } from "@/lib/auth";
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
├── docker-compose.dev.yml          # local dev stack (app + postgres)
├── Dockerfile.dev                  # dev image for the Next.js app
├── prisma/
│   └── schema.prisma               # database schema (User, Session, Account, Verification + your models)
├── prisma.config.ts                # Prisma CLI configuration
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── auth/
│   │   │       └── [...all]/
│   │   │           └── route.ts    # Better Auth catch-all handler
│   │   └── ...                     # Next.js App Router pages
│   ├── generated/
│   │   └── prisma/                 # auto-generated Prisma client (gitignored)
│   └── lib/
│       ├── auth.ts                 # Better Auth server instance + type exports
│       ├── auth-client.ts          # Better Auth React client
│       └── prisma.ts               # Prisma client singleton
└── .env.example                    # environment variable template
```

## Adding a database model

1. Add the model to `prisma/schema.prisma`.
2. Run `bun run db:migrate` to create a migration and regenerate the client.
3. Import the client in your code:

```ts
import { prisma } from "@/lib/prisma";
```

## Recreating from scratch

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for a full step-by-step walkthrough.
