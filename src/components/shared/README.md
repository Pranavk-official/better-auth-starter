# `src/components/shared/`

App-wide components reused across multiple modules. Exported via `index.ts`.

| Component | Role |
|-----------|------|
| `Providers` | Client wrapper mounting the React Query `QueryClientProvider` (single `QueryClient` per tree) and `AuthProvider`. Mount once near the root layout. |
| `Navbar` | Top navigation with the role-aware avatar dropdown (admins → "Admin dashboard"; others → profile links) — **every** signed-in user also gets a confirmed **Sign out** — or a "Sign in" button when logged out. |
| `ConfirmDialog` | Reusable confirmation modal (shadcn `AlertDialog`). Controlled `open`; supports `destructive` + `pending`. Use instead of `window.confirm`. |
| `SignOutConfirm` / `SignOutButton` | Sign-out confirmation built on `ConfirmDialog`. `SignOutConfirm` is controlled (render your own trigger); `SignOutButton` is the standalone button. Always sign out through these — never call `signOut()` directly. |

Put a component here only when it's genuinely cross-cutting; feature-specific UI
belongs in its own `components/<module>/` folder.
