# better-auth-starter

A Next.js starter template with [Prisma](https://www.prisma.io/) ORM, PostgreSQL, and a fully containerised local development environment powered by [Docker Compose](https://docs.docker.com/compose/).

## Tech stack

- **Framework** — [Next.js 16](https://nextjs.org) (App Router, TypeScript)
- **Styling** — [Tailwind CSS v4](https://tailwindcss.com)
- **ORM** — [Prisma 7](https://www.prisma.io) with PostgreSQL
- **Runtime / package manager** — [Bun](https://bun.sh)
- **Local infrastructure** — Docker Compose (PostgreSQL 16)

## Prerequisites

- [Bun](https://bun.sh) ≥ 1.0
- [Docker](https://www.docker.com) with the Compose plugin

## Quick start

### Option A — everything in Docker (recommended)

Runs both the Next.js dev server and PostgreSQL as containers with hot-reload via bind mounts.

```sh
docker compose -f docker-compose.dev.yml up --build
```

Open [http://localhost:3000](http://localhost:3000).

### Option B — only the database in Docker, app runs locally

```sh
# 1. Start only PostgreSQL
docker compose -f docker-compose.dev.yml up postgres

# 2. Install dependencies
bun install

# 3. Apply database migrations
bun run db:migrate

# 4. Start the dev server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Copy `.env.example` to `.env` and adjust the values if needed.

```sh
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/better_auth_starter?schema=public` | PostgreSQL connection string |

> When running the full Docker Compose stack, the `app` service automatically overrides `DATABASE_URL` to use the `postgres` service hostname.

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
├── docker-compose.dev.yml   # local dev stack (app + postgres)
├── Dockerfile.dev           # dev image for the Next.js app
├── prisma/
│   └── schema.prisma        # database schema
├── prisma.config.ts         # Prisma CLI configuration
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── generated/
│   │   └── prisma/          # auto-generated Prisma client (gitignored)
│   └── lib/
│       └── prisma.ts        # Prisma client singleton
└── .env.example             # environment variable template
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
