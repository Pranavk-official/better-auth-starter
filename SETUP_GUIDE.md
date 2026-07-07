# Recreating better-auth-starter from scratch

A step-by-step guide to reproduce this starter template manually.

## Prerequisites

- [Bun](https://bun.sh) ≥ 1.0 installed (`curl -fsSL https://bun.sh/install | bash`)
- [Docker](https://www.docker.com) with the Compose plugin

---

## Step 1 — Scaffold the Next.js app

```sh
bunx create-next-app@latest better-auth-starter \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --use-bun \
  --no-turbopack \
  --import-alias "@/*"

cd better-auth-starter
```

Flags used:
| Flag | Purpose |
|---|---|
| `--typescript` | Enable TypeScript |
| `--tailwind` | Include Tailwind CSS v4 |
| `--eslint` | Include ESLint config |
| `--app` | Use the App Router |
| `--src-dir` | Place source files under `src/` |
| `--use-bun` | Set bun as the package manager |
| `--no-turbopack` | Use the standard webpack bundler |
| `--import-alias "@/*"` | Alias `@/*` → `src/*` |

---

## Step 2 — Install Prisma

```sh
bun add @prisma/client dotenv
bun add -D prisma
```

---

## Step 3 — Initialise Prisma with PostgreSQL

```sh
bunx prisma init --datasource-provider postgresql
```

This creates:
- `prisma/schema.prisma` — the database schema
- `prisma.config.ts` — Prisma CLI configuration
- `.env` — local environment variables

---

## Step 4 — Update `prisma/schema.prisma`

Add the `url` field to the `datasource` block and confirm the generator output path:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

## Step 5 — Update `.env`

Replace the placeholder connection string with values that match the Docker Compose setup:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/better_auth_starter?schema=public"
```

---

## Step 6 — Update `.gitignore`

Ensure `.env` files are excluded but `.env.example` is committed:

```gitignore
# env files
.env*
!.env.example

# Prisma generated client
/src/generated/prisma
```

The `create-next-app` scaffold already adds `.env*`; just add the negation line and the generated client path.

---

## Step 7 — Create `.env.example`

```env
# Copy this file to .env and fill in your values.
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/better_auth_starter?schema=public"
```

---

## Step 8 — Create the Prisma client singleton

Create `src/lib/prisma.ts`:

```ts
import { PrismaClient } from "../generated/prisma";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

This pattern prevents multiple `PrismaClient` instances from being created during Next.js hot reloads in development.

---

## Step 9 — Create `Dockerfile.dev`

```dockerfile
FROM oven/bun:1-alpine

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

EXPOSE 3000

CMD ["bun", "run", "dev"]
```

---

## Step 10 — Create `docker-compose.dev.yml`

```yaml
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: better_auth_starter
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    restart: unless-stopped
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/better_auth_starter?schema=public
      - NODE_ENV=development
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
      - /app/.next
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  postgres_data:
```

Key points:
- The `app` service mounts the repo as a bind mount for hot-reload.
- Anonymous volumes (`/app/node_modules`, `/app/.next`) prevent the host directories from shadowing the container's built artifacts.
- `depends_on` with `service_healthy` ensures the app waits for Postgres to be ready before starting.
- `DATABASE_URL` inside the container uses `postgres` (the service name) as the hostname instead of `localhost`.

---

## Step 11 — Add database scripts to `package.json`

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "db:generate": "prisma generate",
  "db:migrate": "prisma migrate dev",
  "db:migrate:deploy": "prisma migrate deploy",
  "db:push": "prisma db push",
  "db:studio": "prisma studio",
  "db:seed": "prisma db seed"
}
```

---

## Step 12 — Verify the setup

```sh
# Start only Postgres
docker compose -f docker-compose.dev.yml up postgres -d

# Generate Prisma client and run first migration
bun run db:migrate

# Start the dev server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) — you should see the Next.js welcome page.

---

## What's next?

- Add your first Prisma model in `prisma/schema.prisma` and run `bun run db:migrate`.
- Install [better-auth](https://better-auth.com) for authentication: `bun add better-auth`.
- Add server actions or API routes under `src/app/api/`.
