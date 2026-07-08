# `src/components/ui/`

Low-level **shadcn/ui** primitives (Avatar, Button, Card, DropdownMenu, Input,
Label, Separator). These are the design-system building blocks composed by the
higher-level components.

## Important

- This project's shadcn/ui is built on **`@base-ui/react`**, not Radix. Polymorphism
  uses the **`render`** prop, not `asChild`:
  ```tsx
  <Button render={<Link href="/login" />}>Sign in</Button>
  ```
- **Tailwind CSS v4** — there is no `tailwind.config.*`; tokens/config live in
  `src/app/globals.css`.
- Add primitives with the shadcn CLI (`bunx shadcn@latest add <component>`) rather
  than hand-writing them, so variants stay consistent. Prefer composing these into
  feature components over editing them in place.
