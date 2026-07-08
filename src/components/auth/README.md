# `src/components/auth/`

Client components for the public authentication pages
([`app/(auth)/`](../../app)). Exported via `index.ts`.

| Component | Used by | Notes |
|-----------|---------|-------|
| `LoginForm` | `/login` | Email **or** username + password, plus Google. Accepts a `redirectTo` prop (sanitized from `?redirect=`). Surfaces `EMAIL_NOT_VERIFIED` as a friendly notice. |
| `SignupForm` | `/signup` | Name, username, email, password, plus Google. Shows a "check your email" state after submit (no session until verified). |

## Notes

- Forms use `react-hook-form` + `zodResolver` against schemas in
  [`@/lib/zod/auth.zod.ts`](../../lib/zod).
- Credential calls: `signIn.email` / `signIn.username` / `signUp.email` from
  [`@/lib/auth-client`](../../lib/auth-client); social via `signIn.social`.
- New accounts are always `role: "user"` — admins are promoted separately
  (see [`scripts/`](../../../scripts)). There is no self-service admin signup.
