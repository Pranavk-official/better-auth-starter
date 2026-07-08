# `src/components/profile/`

Client components for the protected profile pages
([`app/profile/`](../../app)). Exported via `index.ts`.

| Component | Role |
|-----------|------|
| `EditForm` | Edits the signed-in user's name/image. Submits via React Query `useMutation` → the `updateProfile` server action, then routes back to `/profile/view`. |

## Notes

- Validation uses [`@/lib/zod/profile.zod.ts`](../../lib/zod).
- The mutation calls the server action in
  [`@/actions/profile`](../../actions) — it does not talk to the DB directly.
