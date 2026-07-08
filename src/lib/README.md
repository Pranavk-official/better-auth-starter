# `src/lib/`

Core library code shared across the app.

| File / folder | Purpose |
|---------------|---------|
| `auth.ts` | Better Auth **server** instance (`auth`). Configures email/password, email verification, social providers, and the `admin` + `username` plugins. Also re-exports `Session` / `User` types. |
| `auth-client.ts` | Better Auth **React client** (`authClient`) + named exports `signIn`, `signOut`, `signUp`, `useSession`, `getSession`. |
| `prisma.ts` | Prisma singleton. Creates a `pg.Pool` wrapped by `PrismaPg` (Prisma 7 requires a driver adapter). Import `{ prisma }` — never `new PrismaClient()`. |
| `utils.ts` | Small shared helpers (e.g. `cn()` class merger). |
| [`helpers/`](./helpers) | Server-side session helpers (`getServerSession`). |
| [`vendors/`](./vendors) | Third-party service integrations (SMTP mailer, …). |
| [`zod/`](./zod) | Zod validation schemas, one file per module. |

## Conventions

- **Server vs client:** `auth.ts` is server-only; `auth-client.ts` is for client
  components. Don't import `auth.ts` into a client component.
- Add a social provider in the `socialProviders` block of `auth.ts` **and**
  document its env vars in `.env.example`.
- Third-party clients go in [`vendors/`](./vendors), not loose in `lib/`.
