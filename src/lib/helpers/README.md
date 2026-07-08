# `src/lib/helpers/`

Server-side helper functions. Re-exported through `index.ts`, so import from the
folder: `import { getServerSession } from "@/lib/helpers"`.

## `getServerSession()`

Wraps `auth.api.getSession({ headers })` in React `cache()` so multiple calls in
the same request (e.g. a layout **and** its page) hit the session once.

```ts
import { getServerSession } from "@/lib/helpers";

const session = await getServerSession();
if (!session) redirect("/login");
```

## Notes

- **Server components / layouts / server actions only** — it reads `next/headers`.
- This is the canonical way to read the session on the server; don't call
  `auth.api.getSession` ad hoc in pages.
