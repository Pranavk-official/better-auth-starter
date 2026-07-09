# `src/lib/types/`

Shared TypeScript types, one file per module: `<module>.ts`. Re-exported through
`index.ts`, so import from the barrel:

```ts
import type { AuthFormProps, AuthTab } from "@/lib/types";
```

| File | Types |
|------|-------|
| `common.ts` | `ConfirmDialogProps` (shared confirmation modal) |
| `auth.ts` | `AuthTab`, `AuthFormProps`, `AuthModalProps`, `GoogleButtonProps`, `SignInFormProps`, `SignUpFormProps` |
| `admin.ts` | `Role` + `ROLES` const, `AdminUserRow`, `AdminStats`, `AuditEntry`, and `Props` for the admin components |

## Client-safe role values

`ROLES` (in `admin.ts`) is a plain const mirroring Prisma's `UserRole` enum, so
**client** components can use `ROLES.admin` without importing the Prisma runtime
(which would pull `node:async_hooks` into the browser bundle). `satisfies
Record<Role, Role>` fails the build if the enum and the mirror ever drift. This
file only ever imports Prisma types (erased at compile time), so `@/lib/types`
stays safe to import from client code.

## Conventions

- **Naming (industry standard, no Hungarian prefixes):** interfaces are
  PascalCase with **no `I` prefix**; a component's props interface is
  `<Component>Props` (e.g. `AuthFormProps`).
- `interface` for object shapes; `type` for unions / primitive aliases
  (`type AuthTab = "signin" | "signup"`).
- Put a component's `Props` here (not inline) once it has more than a trivial
  shape; keep one file per feature module and export it from `index.ts`.
