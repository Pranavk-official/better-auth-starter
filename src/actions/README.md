# `src/actions/`

**Server Actions** — server-side mutations callable from client components.
Grouped by module: `src/actions/<module>/index.ts`, each file starting with the
`"use server"` directive.

## Rules

- **Always verify the session first.** Server Actions are callable endpoints:
  ```ts
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  ```
- **Validate input with Zod** from [`@/lib/zod`](../lib/zod) before using it —
  treat the argument as `unknown` and `.parse()` it.
- **Revalidate** affected routes with `revalidatePath(...)` after a mutation.

## Calling from the client

Invoke via React Query's `useMutation` (see [`components/`](../components)):

```ts
const { mutate } = useMutation({ mutationFn: (data) => updateProfile(data) });
```

## When NOT to use a Server Action

Use an API route handler ([`app/api/`](../app)) instead for endpoints consumed by
external clients, webhooks, file uploads, or streaming responses.

## Existing modules

- `profile/` — `updateProfile()` updates the signed-in user's name/image.
