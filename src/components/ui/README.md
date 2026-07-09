# `src/components/ui/`

Low-level **shadcn/ui** primitives (Avatar, Button, Card, DropdownMenu, Input,
Label, Separator, Tabs, Dialog, AlertDialog, Table, Badge, PasswordInput). These
are the design-system building blocks composed by the higher-level components.
Use `Dialog` for content modals and `AlertDialog` for confirmations (see the
shared `ConfirmDialog`).

## Important

- This project's shadcn/ui is built on **`@base-ui/react`**, not Radix. Polymorphism
  uses the **`render`** prop, not `asChild`:
  ```tsx
  <Button render={<Link href="/login" />}>Sign in</Button>
  ```
- **Tailwind CSS v4** — there is no `tailwind.config.*`; tokens/config live in
  `src/app/globals.css`.
- Add primitives with the shadcn CLI (`bunx shadcn@latest add <component> --yes`)
  rather than hand-writing them, so variants stay consistent (style `base-nova`).
  If it prompts to overwrite a customized file like `button.tsx`, answer **no**.
  Prefer composing these into feature components over editing them in place.
