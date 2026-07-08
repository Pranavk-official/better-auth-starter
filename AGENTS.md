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
- React Query (`@tanstack/react-query`) is set up via `Providers` in `src/components/shared/providers.tsx`. Use `useMutation` for server action calls.
- Auth context is in `src/context/auth.tsx` — use `useAuth()` in client components instead of calling `useSession` directly.
- Zod validation schemas live in `src/lib/zod/<module>.zod.ts`.
- Server actions live in `src/actions/<module>/index.ts`.
- API route handlers live in `src/app/api/<module>/route.ts`. Use route handlers (not server actions) for: endpoints consumed by external clients, webhooks, file uploads, streaming responses, or when you need full control over the HTTP response. Always verify the session inside every route handler — they are reachable via direct HTTP requests.
- Shared components live in `src/components/shared/`, module components in `src/components/<module>/`. Both export through `index.ts`.
- Route groups: `(auth)` for login/auth pages, `(public)` for unauthenticated-accessible pages, `(profile)` for protected profile pages.
- Admin area lives at `src/app/admin/` — login page at `admin/login/page.tsx` (no guard), protected pages inside `admin/(protected)/` (layout checks `role === "admin"`).
- Admin components live in `src/components/admin/` and export through `index.ts`.
- TypeScript strict mode is enabled. Do not use `any` unless absolutely unavoidable.
- Do not add `console.log` statements to committed code.
<!-- END:project-rules -->

<!-- BEGIN:skills -->
## Skills

Reusable behaviour packs live in `.agents/skills/<name>/SKILL.md`. Load the relevant file with `read_file` when the trigger fires — do not guess the rules from the README.

| Skill | Trigger | Path |
|-------|---------|------|
| **caveman** | User says "caveman mode", "talk like caveman", "use caveman", "less tokens", "be brief", or types `/caveman` | `.agents/skills/caveman/SKILL.md` |
<!-- END:skills -->
