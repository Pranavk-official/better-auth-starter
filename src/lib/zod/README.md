# `src/lib/zod/`

**Zod** validation schemas, one file per module: `<module>.zod.ts`. Each schema
also exports its inferred input type.

| File | Schemas |
|------|---------|
| `auth.zod.ts` | `loginSchema` (identifier + password), `signupSchema` (name, username, email, password) |
| `profile.zod.ts` | `profileSchema` (name, image) |

## Conventions

```ts
export const loginSchema = z.object({ /* … */ });
export type LoginInput = z.infer<typeof loginSchema>;
```

- Consumed by `react-hook-form` via `zodResolver` on the client **and** by server
  actions (which re-`.parse()` untrusted input) — never trust client-side
  validation alone.
- Uses **Zod v4** (e.g. `z.email()` as a top-level validator).
- Keep one file per feature module; export both the schema and its `z.infer` type.
