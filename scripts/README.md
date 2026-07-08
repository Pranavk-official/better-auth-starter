# `scripts/`

One-off maintenance scripts run with `bun`. They import the app's Prisma singleton
(`@/lib/prisma`), so `@/*` path aliases and `.env` (auto-loaded by Bun) apply.

| Script | Command | Purpose |
|--------|---------|---------|
| `make-admin.ts` | `bun run make:admin <email>` | Promote an **existing** user to `role: "admin"`. |

## `make:admin`

```bash
bun run make:admin you@example.com
```

Sets `role = "admin"` for the matching user. Exits non-zero if no user has that
email (sign up first). After promotion, sign out and back in to refresh the
session. The admin area (`/admin/dashboard`) is gated on `role === "admin"`.

## Related

- To **create** a fresh admin from scratch (rather than promote one), use the
  seed: [`../prisma/seed.ts`](../prisma) via `bun run db:seed`.

## Adding a script

Keep scripts idempotent and safe to re-run; validate CLI args and exit non-zero on
error. Import shared code through the `@/*` alias rather than relative `../src`
paths.
