# `src/`

All application source lives here. The path alias `@/*` resolves to this folder
(e.g. `@/lib/auth` → `src/lib/auth.ts`).

## Layout

| Folder | Purpose |
|--------|---------|
| [`app/`](./app) | Next.js App Router — routes, layouts, API handlers |
| [`actions/`](./actions) | Server Actions (`"use server"`), grouped by module |
| [`components/`](./components) | React components — `shared/`, per-module, and `ui/` primitives |
| [`context/`](./context) | Client-side React context providers |
| [`lib/`](./lib) | Core library code: auth, prisma, helpers, vendors, zod schemas |

## Conventions

- **TypeScript strict mode.** Avoid `any` unless unavoidable.
- **No committed `console.log`.** Remove debug logging before committing.
- Folders that export multiple modules expose a barrel `index.ts`; import from the
  folder (`@/components/auth`) rather than deep file paths.
- See the repo root [`AGENTS.md`](../AGENTS.md) for the full convention list.
