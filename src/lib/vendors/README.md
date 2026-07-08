# `src/lib/vendors/`

Integrations with **third-party services** — SDK/client setup and thin senders for
external vendors. Keeping them here (rather than loose in `lib/`) makes external
dependencies easy to find and swap.

> **Convention:** any new third-party service (email, payments, storage,
> analytics, …) goes in `src/lib/vendors/<vendor>.ts` and is imported via
> `@/lib/vendors/<vendor>`.

## Current vendors

| File | Service | Exports |
|------|---------|---------|
| `nodemailer.ts` | SMTP email (Nodemailer) | `sendEmail({ to, subject, text, html? })` |

### `nodemailer.ts`

Reads `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` (see
`.env.example`) and reuses a single transporter.

- **No `SMTP_HOST` in development** → logs the message (incl. verification link) to
  the server console so flows still work locally.
- **No `SMTP_HOST` in production** → throws (fail loud on misconfig).
- Port `465` = implicit TLS; `587` = STARTTLS.

Used by [`../auth.ts`](../auth.ts) to send email-verification links.

## Note

`prisma.ts` predates this convention and stays at `src/lib/prisma.ts` (its path is
fixed by `AGENTS.md` and imported everywhere). The convention applies to newly
added vendors.
