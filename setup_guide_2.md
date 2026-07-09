# Recreating better-auth-starter from scratch — Part 2

**Auth UX, roles & email verification.** This continues [SETUP_GUIDE.md](./SETUP_GUIDE.md),
which leaves you with the base infra (Prisma 7, the Better Auth server instance,
the catch-all API route, Docker Compose, and DB scripts).

By the end of Part 2 you'll have added, from scratch:

- **Admin & username** Better Auth plugins, with a `role`-based `User` model.
- **One unified `/login`** (email *or* username + password, + Google) and a real
  **`/signup`** page.
- **Email verification** over SMTP (Nodemailer), required for password accounts.
- **Profile pages** (`/profile/view`, `/profile/edit`) backed by a server action.
- A **role-gated admin area** (`/admin/dashboard`) plus two ways to mint an admin.
- The supporting layers: React Query + auth context, Zod schemas, and the
  `src/lib/vendors/` convention for third-party integrations.

> **Prerequisite:** finish Steps 1–16 of [SETUP_GUIDE.md](./SETUP_GUIDE.md) first.

---

## Step 1 — Install the remaining dependencies

```sh
# App-layer libraries
bun add @tanstack/react-query react-hook-form @hookform/resolvers zod

# Email transport (a third-party "vendor")
bun add nodemailer
bun add -D @types/nodemailer

# shadcn/ui primitives (base-ui variant) used by the forms & pages
bunx shadcn@latest add avatar button card dropdown-menu input label separator
```

---

## Step 2 — Enable the admin & username plugins (server)

Edit `src/lib/auth.ts` to register the plugins and re-export the session types:

```ts
import { betterAuth } from "better-auth";
import { admin, username } from "better-auth/plugins";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
    // …other providers as needed
  },
  plugins: [admin(), username()], // 👈 added
});

export type { Session, User } from "better-auth";
```

- `admin()` adds `role`, `banned`, `banReason`, `banExpires` fields and admin APIs.
- `username()` adds `username` + `displayUsername` and `signIn.username`.

---

## Step 3 — Enable the plugins on the client

Edit `src/lib/auth-client.ts` so the client knows about the same plugins:

```ts
import { createAuthClient } from "better-auth/react";
import { adminClient, usernameClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [adminClient(), usernameClient()],
});

export const { signIn, signOut, signUp, useSession, getSession } = authClient;
```

`signIn.username(...)` and `signUp.email({ username })` are now available.

---

## Step 4 — Extend the schema for roles & usernames

The plugins expect extra columns. In `prisma/schema.prisma` add the enum and the
new `User` fields:

```prisma
enum UserRole {
  user
  admin
}

model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  emailVerified Boolean   @default(false)
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  // username plugin
  username        String?   @unique
  displayUsername String?
  // admin plugin
  role          UserRole  @default(user)
  banned        Boolean   @default(false)
  banReason     String?
  banExpires    DateTime?
  sessions      Session[]
  accounts      Account[]
}
```

> ⚠️ Don't forget `displayUsername` — the username plugin writes it on signup, and
> a missing column makes username sign-ups fail.

Create the migration:

```sh
bun run db:migrate --name add_admin_role
```

---

## Step 5 — Add a session helper

Create `src/lib/helpers/session.ts`:

```ts
import { cache } from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// cache() deduplicates across layout + page in the same request
export const getServerSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});
```

And the barrel `src/lib/helpers/index.ts`:

```ts
export * from "./session";
```

Use `getServerSession()` in every server component / layout / route handler.

---

## Step 6 — React Query + auth context

Create `src/context/auth.tsx`:

```tsx
"use client";
import { createContext, useContext } from "react";
import { useSession } from "@/lib/auth-client";

type Session = ReturnType<typeof useSession>["data"];
type AuthContextValue = { session: Session; isPending: boolean };

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  return (
    <AuthContext.Provider value={{ session, isPending }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
```

Create `src/components/shared/providers.tsx`:

```tsx
"use client";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/auth";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 60_000 } } }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
```

Mount it once in `src/app/layout.tsx`:

```tsx
import { Providers } from "@/components/shared";
// …
<body>
  <Providers>{children}</Providers>
</body>
```

Now use `useAuth()` in client components instead of calling `useSession` directly.

---

## Step 7 — Zod schemas

Create `src/lib/zod/auth.zod.ts`:

```ts
import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Use only letters, numbers, and underscores"),
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export type SignupInput = z.infer<typeof signupSchema>;
```

And `src/lib/zod/profile.zod.ts`:

```ts
import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  image: z.string().optional(),
});
export type ProfileInput = z.infer<typeof profileSchema>;
```

---

## Step 8 — Create the email vendor (Nodemailer)

Third-party integrations live under `src/lib/vendors/`. Create
`src/lib/vendors/nodemailer.ts`:

```ts
import nodemailer, { type Transporter } from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT ?? 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM =
  process.env.EMAIL_FROM ?? "Better Auth Starter <no-reply@example.com>";

const globalForMail = globalThis as unknown as {
  mailTransporter?: Transporter | null;
};

function getTransporter(): Transporter | null {
  if (!SMTP_HOST) return null;
  if (globalForMail.mailTransporter === undefined) {
    globalForMail.mailTransporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // 465 = implicit TLS; 587 = STARTTLS
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    });
  }
  return globalForMail.mailTransporter ?? null;
}

export type SendEmailOptions = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export async function sendEmail({ to, subject, text, html }: SendEmailOptions) {
  const transporter = getTransporter();
  if (!transporter) {
    // Dev: log instead of sending. Prod: fail loud on misconfig.
    if (process.env.NODE_ENV === "production") {
      throw new Error("SMTP is not configured (set SMTP_HOST).");
    }
    console.info(`[email] SMTP_HOST not set — not sent.\n  to: ${to}\n\n${text}\n`);
    return;
  }
  await transporter.sendMail({ from: EMAIL_FROM, to, subject, text, html: html ?? text });
}
```

Add the SMTP block to `.env.example` (and `.env`):

```env
# Email (SMTP) — used to send verification links (Nodemailer)
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
EMAIL_FROM="Better Auth Starter <no-reply@example.com>"
```

---

## Step 9 — Turn on email verification

Back in `src/lib/auth.ts`, require verification and wire the mailer:

```ts
import { sendEmail } from "@/lib/vendors/nodemailer";

export const auth = betterAuth({
  // …database, socialProviders, plugins from before…
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true, // block credential sign-in until verified
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,                 // re-send if an unverified user logs in
    autoSignInAfterVerification: true,  // sign in when the link is clicked
    expiresIn: 60 * 60,                 // 1 hour
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your email",
        text: `Confirm your email:\n\n${url}\n\nThis link expires in 1 hour.`,
        html: `<p>Confirm your email:</p><p><a href="${url}">Verify my email</a></p>`,
      });
    },
  },
});
```

Social logins (Google) skip this — the provider already verified the address.

---

## Step 10 — The unified login page

Create the `(auth)` layout that bounces signed-in users, `src/app/(auth)/layout.tsx`:

```tsx
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/helpers";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (session) redirect("/landing");
  return <>{children}</>;
}
```

`src/app/(auth)/login/page.tsx` — reads a sanitized `?redirect=` and passes it down:

```tsx
import { LoginForm } from "@/components/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;
  const redirectTo = redirect?.startsWith("/") ? redirect : "/landing"; // no open redirect
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <LoginForm redirectTo={redirectTo} />
    </div>
  );
}
```

`src/components/auth/login-form.tsx` — the important logic (full Tailwind markup
lives in the repo). It accepts email **or** username, and handles the
"not verified" case:

```tsx
"use client";
// imports: react-hook-form, zodResolver, useRouter, Link, signIn, loginSchema, ui…

export function LoginForm({ redirectTo = "/landing" }: { redirectTo?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const form = useForm<LoginInput>({ resolver: zodResolver(loginSchema), /* … */ });

  async function onGoogleSignIn() {
    await signIn.social({ provider: "google", callbackURL: redirectTo });
  }

  async function onCredentialsSignIn(data: LoginInput) {
    setError(null); setNotice(null);
    const isEmail = data.identifier.includes("@");
    const result = isEmail
      ? await signIn.email({ email: data.identifier, password: data.password, callbackURL: redirectTo })
      : await signIn.username({ username: data.identifier, password: data.password, callbackURL: redirectTo });

    if (result?.error) {
      if (result.error.code === "EMAIL_NOT_VERIFIED") {
        setNotice("Please verify your email first — we just sent a fresh link.");
        return;
      }
      setError(result.error.message ?? "Invalid credentials");
      return;
    }
    router.push(redirectTo);
  }
  // …render: notice banner, Google button, identifier + password fields, link to /signup
}
```

Export it from `src/components/auth/index.ts`:

```ts
export * from "./login-form";
export * from "./signup-form";
```

---

## Step 11 — The signup page

`src/app/(auth)/signup/page.tsx`:

```tsx
import { SignupForm } from "@/components/auth";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <SignupForm />
    </div>
  );
}
```

`src/components/auth/signup-form.tsx` — core logic. Because verification is
required, signup creates **no session**; show a "check your email" state:

```tsx
"use client";
// imports: react-hook-form, zodResolver, Link, signIn, signUp, signupSchema, ui…

export function SignupForm() {
  const [error, setError] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const form = useForm<SignupInput>({ resolver: zodResolver(signupSchema), /* … */ });

  async function onSubmit(data: SignupInput) {
    setError(null);
    const result = await signUp.email({
      name: data.name,
      username: data.username,
      email: data.email,
      password: data.password,
      callbackURL: "/landing",
    });
    if (result?.error) { setError(result.error.message ?? "Could not create account"); return; }
    setSubmittedEmail(data.email); // 👈 "check your inbox" screen, no redirect
  }

  if (submittedEmail) {
    return (/* Card: "Check your email — we sent a link to {submittedEmail}" */);
  }
  // …render: Google button, name/username/email/password fields, link to /login
}
```

---

## Step 12 — Profile pages + edit action

Protect the folder with `src/app/profile/layout.tsx` (note: a **real** `profile`
segment, *not* a `(profile)` route group — a group would move the pages to
`/view` and `/edit`):

```tsx
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/helpers";
import { Navbar } from "@/components/shared";

export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session) redirect("/login");
  return (<><Navbar /><main>{children}</main></>);
}
```

The mutation runs through a server action, `src/actions/profile/index.ts`:

```ts
"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { profileSchema } from "@/lib/zod/profile.zod";

export async function updateProfile(input: unknown) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");            // verify the session
  const { name, image } = profileSchema.parse(input);       // validate input
  await auth.api.updateUser({
    headers: await headers(),
    body: { name, image: image?.trim() || undefined },
  });
  revalidatePath("/profile/view");
}
```

`src/components/profile/edit-form.tsx` calls it via React Query:

```tsx
"use client";
// imports: react-hook-form, zodResolver, useRouter, useMutation, profileSchema, updateProfile, ui…

export function EditProfileForm({ defaultValues }: { defaultValues: ProfileInput }) {
  const router = useRouter();
  const form = useForm<ProfileInput>({ resolver: zodResolver(profileSchema), defaultValues });
  const { mutate, isPending, error } = useMutation({
    mutationFn: (data: ProfileInput) => updateProfile(data),
    onSuccess: () => router.push("/profile/view"),
  });
  return (/* form: name + image inputs, submit → mutate(data) */);
}
```

Add `view/page.tsx` (reads `session.user`) and `edit/page.tsx` (renders
`<EditProfileForm defaultValues={…} />`), plus the barrel
`src/components/profile/index.ts`.

---

## Step 13 — The admin area

Gate it in `src/app/admin/(protected)/layout.tsx`:

```tsx
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/helpers";

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session) redirect("/login?redirect=/admin/dashboard");
  if ((session.user as { role?: string }).role !== "admin") redirect("/landing");
  return <>{children}</>;
}
```

`src/app/admin/(protected)/dashboard/page.tsx` lists users via the admin API:

```tsx
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getServerSession } from "@/lib/helpers";
import { AdminSignOutButton } from "@/components/admin";

export default async function AdminDashboardPage() {
  const session = await getServerSession();
  if (!session) return null;
  const { users } = await auth.api.listUsers({ headers: await headers(), query: { limit: 50 } });
  return (/* header + AdminSignOutButton + list of users with role badges */);
}
```

`src/components/admin/sign-out-button.tsx` returns to `/login` after sign-out.
There is **no** `/admin/login` — admins use the unified `/login`.

---

## Step 14 — Bootstrapping an admin

New signups are always `role: "user"`. Two ways to create an admin:

**A. Seed a fresh admin** — `prisma/seed.ts`:

```ts
import "dotenv/config";
import { hashPassword } from "better-auth/crypto";
import { prisma } from "../src/lib/prisma";

const email = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
const password = process.env.SEED_ADMIN_PASSWORD ?? "admin-password-change-me";
const name = process.env.SEED_ADMIN_NAME ?? "Admin";
const username = process.env.SEED_ADMIN_USERNAME ?? "admin";

async function main() {
  if (await prisma.user.findUnique({ where: { email } })) return;
  const hashed = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email, emailVerified: true, username, role: "admin" },
  });
  await prisma.account.create({
    data: { accountId: user.id, providerId: "credential", userId: user.id, password: hashed },
  });
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
```

Wire `prisma db seed` to it via `prisma.config.ts` (or the `prisma.seed` key), then
`bun run db:seed`. The seeded admin is created **already verified**.

**B. Promote an existing user** — `scripts/make-admin.ts`:

```ts
import { prisma } from "@/lib/prisma";

async function main() {
  const email = process.argv[2];
  if (!email) { console.error("Usage: bun run make:admin <email>"); process.exit(1); }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) { console.error(`No user with email "${email}".`); process.exit(1); }
  await prisma.user.update({ where: { email }, data: { role: "admin" } });
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
```

Add the script to `package.json`:

```json
"make:admin": "bun run scripts/make-admin.ts"
```

---

## Step 15 — Run & verify the full flow

```sh
cp .env.example .env                  # set BETTER_AUTH_SECRET (openssl rand -base64 32)
docker compose -f docker-compose.dev.yml up postgres -d
bun install
bun run db:migrate                    # apply all migrations
bun run db:seed                       # optional: create the admin
bun run dev
```

Then walk the flow:

1. **Sign up** at `/signup` → "check your email" screen (no session yet).
2. **Grab the link** — from your inbox, or (no SMTP) from the server console:
   `[email] SMTP_HOST not set … http://localhost:3000/api/auth/verify-email?token=…`
3. **Open the link** → verified, auto-signed-in, redirected to `/landing`.
4. **Log in** at `/login` with email *or* username (or Google).
5. **Admin:** `bun run make:admin you@example.com`, sign out/in, then visit
   `/admin/dashboard`.

---

## What's next?

- Add more social providers in `auth.ts` (and document their env vars).
- Add `sendResetPassword` to `auth.ts` using the same `sendEmail` vendor for a
  password-reset flow.
- Put any new third-party client in `src/lib/vendors/<vendor>.ts`.
