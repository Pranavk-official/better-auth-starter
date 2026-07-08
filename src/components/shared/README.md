# `src/components/shared/`

App-wide components reused across multiple modules. Exported via `index.ts`.

| Component | Role |
|-----------|------|
| `Providers` | Client wrapper mounting the React Query `QueryClientProvider` (single `QueryClient` per tree) and `AuthProvider`. Mount once near the root layout. |
| `Navbar` | Top navigation with the session-aware avatar dropdown (profile links, sign out) or a "Sign in" button. |

Put a component here only when it's genuinely cross-cutting; feature-specific UI
belongs in its own `components/<module>/` folder.
