# `src/components/`

React components. Each folder exposes a barrel `index.ts`; import from the folder
(`@/components/auth`), not deep file paths.

## Organization

| Folder | Contents |
|--------|----------|
| [`ui/`](./ui) | Low-level shadcn/ui primitives (Button, Card, Input, …). Generated. |
| [`shared/`](./shared) | App-wide components: `Navbar`, `Providers`. |
| [`auth/`](./auth) | Login & signup forms. |
| [`admin/`](./admin) | Admin-area components (dashboard sign-out, etc.). |
| [`profile/`](./profile) | Profile editing UI. |

Rule of thumb: reused across modules → `shared/`; specific to one feature →
`<module>/`; a design-system primitive → `ui/`.

## Conventions

- shadcn/ui here is built on **`@base-ui/react`** (not Radix). Use the **`render`**
  prop for polymorphism, **not** `asChild`:
  ```tsx
  <Button render={<Link href="/login" />}>Sign in</Button>
  ```
- Client components need the `"use client"` directive.
- For auth state in a client component use `useAuth()` from
  [`@/context/auth`](../context) — don't call `useSession` directly.
- Server-action calls go through React Query's `useMutation`.
