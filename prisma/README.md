# `prisma/`

Database schema, migrations, seed, and the generated client for **Prisma 7 +
PostgreSQL**.

| Path | Purpose |
|------|---------|
| `schema.prisma` | Data model (User, Session, Account, `UserRole` enum, …). |
| `migrations/` | Committed SQL migration history. |
| `generated/` | Generated Prisma client — **gitignored**. Run `bun run db:generate` after pulling schema changes. |
| `seed.ts` | Seeds an admin user (see below). |

> Prisma CLI config lives in [`../prisma.config.ts`](../prisma.config.ts) (schema
> path, migrations path, datasource URL).

## Everyday commands

Always go through the `bun run db:*` scripts — never run raw `prisma` commands.

| Command | Does |
|---------|------|
| `bun run db:generate` | Regenerate the client into `generated/`. |
| `bun run db:migrate` | Create + apply a migration in dev (`--name <name>`). |
| `bun run db:deploy` | Apply pending migrations (prod/CI). |
| `bun run db:studio` | Open Prisma Studio. |
| `bun run db:seed` | Run `seed.ts`. |
| `bun run db:reset` | Drop, re-migrate, re-seed (destructive). |

## Driver adapter (required)

Prisma 7 needs a driver adapter. The singleton in
[`../src/lib/prisma.ts`](../src/lib/prisma.ts) wraps a `pg.Pool` with `PrismaPg`.
Import `{ prisma }` from there — never `new PrismaClient()` without the `adapter`.

## Seeding an admin

`seed.ts` creates a **verified admin** (with a credential password) from env vars,
skipping if the email already exists:

```
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=change-me
SEED_ADMIN_USERNAME=admin
SEED_ADMIN_NAME=Admin
```

Run with `bun run db:seed`. To promote an **existing** user instead of creating
one, use [`../scripts/make-admin.ts`](../scripts) (`bun run make:admin <email>`).
