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
- The generated client is output to `src/generated/prisma/` — **this directory is gitignored**. Always run `bun run db:generate` after pulling schema changes.
- **Prisma 7 requires a driver adapter.** The singleton in `src/lib/prisma.ts` creates a `pg.Pool` and wraps it with `PrismaPg` from `@prisma/adapter-pg`. Never call `new PrismaClient()` without the `adapter` option.
- Import the Prisma singleton (never instantiate `PrismaClient` directly in application code):
  ```ts
  import { prisma } from "@/lib/prisma";
  ```
- Import types from the generated client path:
  ```ts
  import type { User } from "@/generated/prisma/client";
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
- To get the session server-side: `auth.api.getSession({ headers: await headers() })`.
- To sign in client-side: `authClient.signIn.social({ provider: "<id>" })` or `authClient.signIn.email({ email, password })`.
- When adding a new social provider, add it to the `socialProviders` block in `src/lib/auth.ts` and document the env vars in `.env.example`.

## Code conventions

- All source files live under `src/`.
- Path alias `@/*` resolves to `src/*`.
- Tailwind CSS v4 is used — no `tailwind.config.*` file; configuration lives in `globals.css`.
- TypeScript strict mode is enabled. Do not use `any` unless absolutely unavoidable.
- Do not add `console.log` statements to committed code.
<!-- END:project-rules -->
