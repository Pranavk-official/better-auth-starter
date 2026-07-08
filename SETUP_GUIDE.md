# Recreating better-auth-starter from scratch

A step-by-step guide to reproduce this starter template manually — Next.js 16, Prisma 7, Better Auth, 15 social login providers, PostgreSQL, and Docker Compose.

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

Then add a second alias for the `prisma/` folder in `tsconfig.json`:

```json
"paths": {
  "@/*": ["./src/*"],
  "@prisma/*": ["./prisma/*"]
}
```

---

## Step 2 — Install Prisma and the pg driver adapter

Prisma 7 requires a driver adapter for direct database connections — the classic `new PrismaClient()` constructor no longer accepts a bare connection string.

```sh
bun add @prisma/client @prisma/adapter-pg pg dotenv
bun add -D prisma @types/pg
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

Confirm the generator output path. In Prisma 7 the connection URL lives in `prisma.config.ts`, **not** in the schema file, so the datasource block only needs the provider:

```prisma
generator client {
  provider = "prisma-client"
  output   = "./generated"
}

datasource db {
  provider = "postgresql"
}
```

Then add the four models required by Better Auth:

```prisma
model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  emailVerified Boolean   @default(false)
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  sessions      Session[]
  accounts      Account[]
}

model Session {
  id        String   @id @default(cuid())
  expiresAt DateTime
  token     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  ipAddress String?
  userAgent String?
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Account {
  id                    String    @id @default(cuid())
  accountId             String
  providerId            String
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
}

model Verification {
  id         String    @id @default(cuid())
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime? @default(now())
  updatedAt  DateTime? @updatedAt
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
/prisma/generated
```

The `create-next-app` scaffold already adds `.env*`; just add the negation line and the generated client path.

---

## Step 7 — Create `.env.example`

```env
# Copy this file to .env and fill in your values.
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/better_auth_starter?schema=public"

# Better Auth
# Generate a secret with: openssl rand -base64 32
BETTER_AUTH_SECRET=""
BETTER_AUTH_URL="http://localhost:3000"

# Social providers — fill in only the ones you want to enable.
# Callback URL pattern: http://localhost:3000/api/auth/callback/<provider>
APPLE_CLIENT_ID=""          APPLE_CLIENT_SECRET=""
DISCORD_CLIENT_ID=""        DISCORD_CLIENT_SECRET=""
DROPBOX_CLIENT_ID=""        DROPBOX_CLIENT_SECRET=""
FACEBOOK_CLIENT_ID=""       FACEBOOK_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""         GITHUB_CLIENT_SECRET=""
GITLAB_CLIENT_ID=""         GITLAB_CLIENT_SECRET=""
GOOGLE_CLIENT_ID=""         GOOGLE_CLIENT_SECRET=""
LINKEDIN_CLIENT_ID=""       LINKEDIN_CLIENT_SECRET=""
MICROSOFT_CLIENT_ID=""      MICROSOFT_CLIENT_SECRET=""
REDDIT_CLIENT_ID=""         REDDIT_CLIENT_SECRET=""
ROBLOX_CLIENT_ID=""         ROBLOX_CLIENT_SECRET=""
SPOTIFY_CLIENT_ID=""        SPOTIFY_CLIENT_SECRET=""
TIKTOK_CLIENT_KEY=""        TIKTOK_CLIENT_SECRET=""   # TikTok uses CLIENT_KEY, not CLIENT_ID
TWITCH_CLIENT_ID=""         TWITCH_CLIENT_SECRET=""
TWITTER_CLIENT_ID=""        TWITTER_CLIENT_SECRET=""
```

---

## Step 8 — Create the Prisma client singleton

Create `src/lib/prisma.ts`:

```ts
import { PrismaClient } from "@prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

function createPrismaClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

This pattern prevents multiple `PrismaClient` instances from being created during Next.js hot reloads in development.

> **Prisma 7 note:** The generated client is output to `prisma/generated/` per the schema config. Always import from `@prisma/generated/client` using the `@prisma/*` path alias (resolves to `prisma/*`). Prisma 7 also requires a driver adapter — `PrismaPg` wraps a `pg.Pool` to provide the SQL connection.

---

## Step 9 — Install Better Auth

```sh
bun add better-auth
```

---

## Step 10 — Create `src/lib/auth.ts`

This is the server-side Better Auth instance. Configure only the social providers you want to use — remove the rest.

```ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    apple:     { clientId: process.env.APPLE_CLIENT_ID as string,     clientSecret: process.env.APPLE_CLIENT_SECRET as string },
    discord:   { clientId: process.env.DISCORD_CLIENT_ID as string,   clientSecret: process.env.DISCORD_CLIENT_SECRET as string },
    dropbox:   { clientId: process.env.DROPBOX_CLIENT_ID as string,   clientSecret: process.env.DROPBOX_CLIENT_SECRET as string },
    facebook:  { clientId: process.env.FACEBOOK_CLIENT_ID as string,  clientSecret: process.env.FACEBOOK_CLIENT_SECRET as string },
    github:    { clientId: process.env.GITHUB_CLIENT_ID as string,    clientSecret: process.env.GITHUB_CLIENT_SECRET as string },
    gitlab:    { clientId: process.env.GITLAB_CLIENT_ID as string,    clientSecret: process.env.GITLAB_CLIENT_SECRET as string },
    google:    { clientId: process.env.GOOGLE_CLIENT_ID as string,    clientSecret: process.env.GOOGLE_CLIENT_SECRET as string },
    linkedin:  { clientId: process.env.LINKEDIN_CLIENT_ID as string,  clientSecret: process.env.LINKEDIN_CLIENT_SECRET as string },
    microsoft: { clientId: process.env.MICROSOFT_CLIENT_ID as string, clientSecret: process.env.MICROSOFT_CLIENT_SECRET as string },
    reddit:    { clientId: process.env.REDDIT_CLIENT_ID as string,    clientSecret: process.env.REDDIT_CLIENT_SECRET as string },
    roblox:    { clientId: process.env.ROBLOX_CLIENT_ID as string,    clientSecret: process.env.ROBLOX_CLIENT_SECRET as string },
    spotify:   { clientId: process.env.SPOTIFY_CLIENT_ID as string,   clientSecret: process.env.SPOTIFY_CLIENT_SECRET as string },
    tiktok:    { clientKey: process.env.TIKTOK_CLIENT_KEY as string,  clientSecret: process.env.TIKTOK_CLIENT_SECRET as string },
    twitch:    { clientId: process.env.TWITCH_CLIENT_ID as string,    clientSecret: process.env.TWITCH_CLIENT_SECRET as string },
    twitter:   { clientId: process.env.TWITTER_CLIENT_ID as string,   clientSecret: process.env.TWITTER_CLIENT_SECRET as string },
  },
});

export type { Session, User } from "better-auth";
```

---

## Step 11 — Create `src/lib/auth-client.ts`

```ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();

export const { signIn, signOut, signUp, useSession, getSession } = authClient;
```

---

## Step 12 — Create the catch-all API route

Create `src/app/api/auth/[...all]/route.ts`:

```ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

---

---

## Step 13 — Create `Dockerfile.dev`

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

## Step 14 — Create `docker-compose.dev.yml`

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

## Step 15 — Add database scripts to `package.json`

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

## Step 16 — Verify the setup

```sh
# Copy and configure the env file
cp .env.example .env
# Fill in BETTER_AUTH_SECRET (openssl rand -base64 32) and any social provider credentials

# Start only Postgres
docker compose -f docker-compose.dev.yml up postgres -d

# Run first migration (creates User, Session, Account, Verification tables)
bun run db:migrate

# Start the dev server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) — you should see the Next.js welcome page.

---

## What's next?

- Add your first custom Prisma model in `prisma/schema.prisma` and run `bun run db:migrate`.
- Add server actions or API routes under `src/app/api/`.
- Use `authClient.signIn.social({ provider: "github" })` on the client to trigger a social login flow.
- Use `auth.api.getSession({ headers: await headers() })` in Server Components to read the current session.
