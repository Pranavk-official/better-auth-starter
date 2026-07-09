# Setup Guide 2 — Current `feat/google-auth` Branch

A from-zero guide to getting **this branch** running, reflecting everything it now
includes on top of the base starter:

- **Unified authentication** — one `/login` (email *or* username + password, +
  Google) for users and admins, plus a real `/signup` page.
- **Email verification** — required for email/password accounts, sent over SMTP
  (Nodemailer), with a dev console fallback.
- **Admin area** — role-gated `/admin/dashboard`, bootstrapped via a seed or a
  promote script.
- **Profile pages** — `/profile/view` and `/profile/edit`.
- **Vendors convention** — third-party integrations under `src/lib/vendors/`.

> If you just want a quick run, see the **TL;DR** at the bottom. Everything else
> explains the *why* so a new machine doesn't get stuck.

---

## 1. Prerequisites

- [Bun](https://bun.sh) ≥ 1.0  (the **only** package manager — no npm/pnpm/yarn)
- [Docker](https://www.docker.com) with the Compose plugin
- Git

---

## 2. Get the code

```sh
git clone <your-repo-url> better-auth-starter
cd better-auth-starter
git checkout feat/google-auth
```

---

## 3. Environment variables

```sh
cp .env.example .env
```

### Core (required)

| Variable | Example | Notes |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/better_auth_starter?schema=public` | Uses `localhost` for the app running **outside** Docker. The Docker `app` service overrides this to the `postgres` hostname automatically. |
| `BETTER_AUTH_SECRET` | *(generate)* | **Required.** `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | `http://localhost:3000` | Base URL; used to build verification + OAuth callback URLs. |

### Email / SMTP (for verification)

Email verification is **on** for email/password signups, so the app needs to send
mail. Any SMTP provider works.

| Variable | Example | Notes |
|---|---|---|
| `SMTP_HOST` | `localhost` | Leave **blank in dev** to log the verification link to the server console instead of sending. In production, blank → throws. |
| `SMTP_PORT` | `587` | `465` = implicit TLS; `587` = STARTTLS. |
| `SMTP_USER` / `SMTP_PASS` | — | Optional for local relays (e.g. Mailpit). |
| `EMAIL_FROM` | `Better Auth Starter <no-reply@example.com>` | From header. |

> **Local mail testing:** [Mailpit](https://github.com/axllent/mailpit)
> (`SMTP_HOST=localhost`, `SMTP_PORT=1025`) or Mailtrap give you a real inbox UI.
> Without SMTP configured, grab the link from the app logs (see §6).

### Social providers

Fill in only the ones you want (Google is wired up by default). Each OAuth app's
callback URL is:

```
http://localhost:3000/api/auth/callback/<provider>
```

See `.env.example` for the full list (Apple, Discord, GitHub, Google, …).

---

## 4. Run the stack

### Option A — everything in Docker (recommended, most reliable cross-platform)

```sh
docker compose -f docker-compose.dev.yml up --build -d
```

This starts PostgreSQL and the Next.js dev server. Then **apply migrations inside
the container** (see §5 for why this matters):

```sh
docker compose -f docker-compose.dev.yml exec app bun run db:deploy
```

Open <http://localhost:3000>.

### Option B — database in Docker, app on the host

```sh
docker compose -f docker-compose.dev.yml up postgres -d
bun install
bun run db:migrate      # applies migrations + generates the client
bun run dev
```

Open <http://localhost:3000>.

---

## 5. Database setup & migrations

This branch ships three migrations: `init`, `add_admin_role`, and
`add_display_username`. **The app container does not auto-migrate** — a fresh DB
has no tables until you run a migrate command. Skipping this is the #1 cause of
"login does nothing / 500s": Better Auth queries a table that doesn't exist.

| Command | Use |
|---|---|
| `bun run db:deploy` | Apply committed migrations (non-interactive). Best for a new machine / CI / inside Docker. |
| `bun run db:migrate` | Create **and** apply a new migration in dev (`--name <name>`). |
| `bun run db:generate` | Regenerate the Prisma client into `prisma/generated/` (gitignored — run after pulling schema changes). |
| `bun run db:studio` | Browse data in Prisma Studio. |
| `bun run db:seed` | Seed an admin (see §7). |
| `bun run db:reset` | Drop, re-migrate, re-seed (destructive). |

> Note: Prisma 7 requires a driver adapter — the singleton in `src/lib/prisma.ts`
> wraps a `pg.Pool` with `PrismaPg`. Never `new PrismaClient()` without the adapter.

---

## 6. First run — sign up & verify

1. Go to <http://localhost:3000/signup> and register (name, username, email,
   password). You'll land on a **"Check your email"** screen — no session is
   created until the email is verified.
2. Get the verification link:
   - **With SMTP configured:** open the email in your inbox / Mailpit.
   - **Without SMTP (dev):** read it from the server logs:
     ```sh
     docker compose -f docker-compose.dev.yml logs --tail 50 app
     # look for: [email] SMTP_HOST not set — email not sent ... http://localhost:3000/api/auth/verify-email?token=...
     ```
3. Open the link. You're verified, auto-signed-in, and redirected to `/landing`.
4. From now on `/login` works with your email **or** username (or Google). If you
   try to log in before verifying, you're blocked and a fresh link is re-sent.

---

## 7. Create an admin

The admin area (`/admin/dashboard`) requires `role === "admin"`. New signups are
always `role: "user"`. Two ways to get an admin:

### A. Seed a fresh admin

Set these in `.env`, then run the seed. The seeded admin is created **already
verified** with a password login:

```sh
# .env
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=change-me
SEED_ADMIN_USERNAME=admin
SEED_ADMIN_NAME=Admin
```

```sh
bun run db:seed
# inside Docker: docker compose -f docker-compose.dev.yml exec app bun run db:seed
```

### B. Promote an existing user

```sh
bun run make:admin you@example.com
# inside Docker: docker compose -f docker-compose.dev.yml exec app bun run make:admin you@example.com
```

Sign out and back in to refresh the session, then open
<http://localhost:3000/admin/dashboard>.

---

## 8. How auth is wired on this branch

- **Server instance:** `src/lib/auth.ts` — `emailAndPassword.requireEmailVerification: true`
  plus an `emailVerification` block (`sendOnSignUp`, `sendOnSignIn`,
  `autoSignInAfterVerification`, 1-hour `expiresIn`) that calls the mailer.
- **Mailer:** `src/lib/vendors/nodemailer.ts` — `sendEmail(...)` over SMTP with the
  dev console fallback.
- **Client:** `src/lib/auth-client.ts` — `signIn` / `signUp` / `signOut` /
  `useSession`; use `useAuth()` from `src/context/auth.tsx` in components.
- **Routes:**
  - `/login` — `src/app/(auth)/login` (unified; honors `?redirect=`).
  - `/signup` — `src/app/(auth)/signup` (creates `role: "user"`).
  - `/profile/view`, `/profile/edit` — `src/app/profile/*` (guarded by its layout).
  - `/admin/dashboard` — `src/app/admin/(protected)/*` (role check; unauth →
    `/login?redirect=/admin/dashboard`). There is **no** `/admin/login`.
  - `/api/auth/[...all]` — Better Auth catch-all.

Social logins (Google) skip email verification — the provider already verifies the
address.

---

## 9. Project structure notes (new on this branch)

```
src/lib/vendors/          # third-party integrations (SMTP mailer) — put new vendors here
scripts/make-admin.ts     # bun run make:admin <email>
prisma/seed.ts            # bun run db:seed  (SEED_ADMIN_* env)
```

Most folders now have a `README.md` describing their usage — start at
[`src/README.md`](./src/README.md). Convention: any new third-party client goes in
`src/lib/vendors/<vendor>.ts`, imported via `@/lib/vendors/<vendor>`.

---

## 10. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Login/signup 500s, or "nothing happens" | Migrations not applied — run `db:deploy` (§5). A fresh DB has no tables. |
| `P1001: Can't reach database server` | Postgres isn't reachable. Ensure the `postgres` container is up, or run migrations inside Docker (`exec app bun run db:deploy`). If port 5432 is already in use, remap to `5433:5432` and update `DATABASE_URL`. |
| Signup succeeds but no email | No SMTP configured — read the link from the app logs (§6), or set `SMTP_*`. |
| "Email not verified" on login | Expected until you click the link. Better Auth just re-sent a fresh one. |
| Can't reach `/admin/dashboard` | Your account is `role: "user"` — promote it (§7). |
| `/profile/...` 404s | Ensure `src/app/profile` is a real folder, **not** `(profile)` — a route group would move the pages to `/view` and `/edit`. |
| Prisma client errors after pulling | Run `bun run db:generate` (the client is gitignored). |

---

## TL;DR

```sh
git checkout feat/google-auth
cp .env.example .env                                  # set BETTER_AUTH_SECRET
docker compose -f docker-compose.dev.yml up --build -d
docker compose -f docker-compose.dev.yml exec app bun run db:deploy
docker compose -f docker-compose.dev.yml exec app bun run db:seed   # optional admin
# open http://localhost:3000/signup — verify via the link in the app logs
```
