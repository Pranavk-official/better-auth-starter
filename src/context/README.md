# `src/context/`

Client-side React **context providers**.

## `auth.tsx`

Wraps Better Auth's `useSession()` and exposes it through `useAuth()` so client
components share one session subscription.

```tsx
"use client";
import { useAuth } from "@/context/auth";

function Greeting() {
  const { session, isPending } = useAuth();
  if (isPending) return null;
  return <span>{session?.user.name}</span>;
}
```

`AuthProvider` is mounted app-wide by `Providers` in
[`components/shared/providers.tsx`](../components/shared) — you don't need to add
it yourself.

## Conventions

- Prefer `useAuth()` over calling `useSession()` directly in components.
- Providers are client components (`"use client"`) and are composed inside
  `Providers`, not scattered across layouts.
