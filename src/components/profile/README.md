# `src/components/profile/`

Client components for the protected profile pages
([`app/profile/`](../../app)). Exported via `index.ts`.

| Component | Role |
|-----------|------|
| `ProfileDetails` | Reads `GET /api/profile` with React Query (`["profile"]`) and renders the profile card. |
| `EditProfileForm` | Edits the signed-in user's name/image. Submits via React Query `useMutation` → the `updateProfile` server action, invalidates `["profile"]`, then routes back to `/profile/view`. |

## Notes

- **Read via API, write via action.** `ProfileDetails` fetches `/api/profile`;
  editing goes through the `updateProfile` server action in
  [`@/actions/profile`](../../actions) — no direct DB access from the client.
- Validation uses [`@/lib/zod/profile.zod.ts`](../../lib/zod).
