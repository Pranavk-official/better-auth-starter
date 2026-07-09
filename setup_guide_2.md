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
- A **role-gated admin area** (`/admin`) plus two ways to mint an admin.
- The supporting layers: React Query + auth context, Zod schemas, and the
  `src/lib/vendors/` convention for third-party integrations.

> **Prerequisite:** finish Steps 1–16 of [SETUP_GUIDE.md](./SETUP_GUIDE.md) first.

---

## Step 1 — Install the remaining dependencies

```sh
# App-layer libraries
bun add @tanstack/react-query react-hook-form @hookform/resolvers zod

# Icons (used by the Google button, password reveal, dialog close, …)
bun add react-icons

# Email transport (a third-party "vendor")
bun add nodemailer
bun add -D @types/nodemailer

# shadcn/ui primitives (base-ui variant) used by the forms & pages
bunx shadcn@latest add avatar button card dropdown-menu input label separator
```

> `tabs` and `dialog` aren't in the shadcn base-ui registry yet — the auth
> surface ships hand-written wrappers over `@base-ui/react` at
> `src/components/ui/tabs.tsx` and `src/components/ui/dialog.tsx`, plus a
> `password-input.tsx` with a `react-icons` show/hide toggle.

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

## Step 10 — The unified auth surface

One `AuthForm` (shadcn `Tabs` switching **Sign in / Sign up**) backs both the
`/login` and `/signup` pages **and** a navbar modal. Each piece is its own
arrow-function component; shared prop types live in `src/lib/types`.

Shared types — `src/lib/types/auth.ts` (barrel-exported from
`src/lib/types/index.ts`, imported via `@/lib/types`):

```ts
import type { ReactNode } from "react";

export type AuthTab = "signin" | "signup";
export interface AuthFormProps { defaultTab?: AuthTab; redirectTo?: string; className?: string; }
export interface AuthModalProps { trigger: ReactNode; defaultTab?: AuthTab; redirectTo?: string; }
export interface GoogleButtonProps { redirectTo: string; }
export interface SignInFormProps { redirectTo: string; }
export interface SignUpFormProps { onDone: () => void; }
```

Create the `(auth)` layout that bounces signed-in users, `src/app/(auth)/layout.tsx`:

```tsx
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/helpers";

const AuthLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await getServerSession();
  if (session) redirect("/");
  return <>{children}</>;
};

export default AuthLayout;
```

Split components under `src/components/auth/` — each in its own file:

- **`google-button.tsx`** — `react-icons` `FcGoogle` + `signIn.social({ provider: "google" })`.
- **`sign-in-form.tsx`** — accepts email **or** username, handles `EMAIL_NOT_VERIFIED`.
- **`sign-up-form.tsx`** — creates the account, then shows a "check your email" state (verification means no session yet).
- **`auth-form.tsx`** — Google button + `Tabs` wiring the two forms.
- **`auth-modal.tsx`** — the same `AuthForm` inside a `Dialog`.

```tsx
// src/components/auth/sign-in-form.tsx (core logic)
"use client";
import type { SignInFormProps } from "@/lib/types";
import { PasswordInput } from "@/components/ui/password-input"; // eye-toggle field

export const SignInForm = ({ redirectTo }: SignInFormProps) => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const form = useForm<LoginInput>({ resolver: zodResolver(loginSchema), /* … */ });

  const onSubmit = async (data: LoginInput) => {
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
  };
  // …render: notice banner, identifier + <PasswordInput> fields
};
```

```tsx
// src/components/auth/auth-form.tsx — the tabs shell
"use client";
import type { AuthFormProps, AuthTab } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GoogleButton } from "./google-button";
import { SignInForm } from "./sign-in-form";
import { SignUpForm } from "./sign-up-form";

export const AuthForm = ({ defaultTab = "signin", redirectTo = "/", className }: AuthFormProps) => {
  const [tab, setTab] = useState<AuthTab>(defaultTab);
  return (
    <Card className={cn("w-full max-w-sm", className)}>
      {/* header + <GoogleButton redirectTo={redirectTo} /> + "or" divider */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as AuthTab)}>
        <TabsList>
          <TabsTrigger value="signin">Sign in</TabsTrigger>
          <TabsTrigger value="signup">Sign up</TabsTrigger>
        </TabsList>
        <TabsContent value="signin"><SignInForm redirectTo={redirectTo} /></TabsContent>
        <TabsContent value="signup"><SignUpForm onDone={() => setTab("signin")} /></TabsContent>
      </Tabs>
    </Card>
  );
};
```

`src/app/(auth)/login/page.tsx` — reads a sanitized `?redirect=` and defaults the tab:

```tsx
import { AuthForm } from "@/components/auth";

const LoginPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) => {
  const { redirect } = await searchParams;
  const redirectTo = redirect?.startsWith("/") ? redirect : "/"; // no open redirect
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <AuthForm defaultTab="signin" redirectTo={redirectTo} />
    </div>
  );
};

export default LoginPage;
```

Export everything from `src/components/auth/index.ts`:

```ts
export * from "./auth-form";
export * from "./auth-modal";
export * from "./google-button";
export * from "./sign-in-form";
export * from "./sign-up-form";
```

---

## Step 11 — Signup, the password field, and the modal

The signup page **reuses the same `AuthForm`**, just defaulting to the signup
tab — `src/app/(auth)/signup/page.tsx`:

```tsx
import { AuthForm } from "@/components/auth";

const SignupPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <AuthForm defaultTab="signup" />
  </div>
);

export default SignupPage;
```

`sign-up-form.tsx` core logic — verification is required, so signup creates
**no session**; show a "check your email" state and offer to jump back to the
sign-in tab via the `onDone` prop:

```tsx
"use client";
import type { SignUpFormProps } from "@/lib/types";
import { PasswordInput } from "@/components/ui/password-input";

export const SignUpForm = ({ onDone }: SignUpFormProps) => {
  const [error, setError] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const form = useForm<SignupInput>({ resolver: zodResolver(signupSchema), /* … */ });

  const onSubmit = async (data: SignupInput) => {
    setError(null);
    const result = await signUp.email({ ...data, callbackURL: "/" });
    if (result?.error) { setError(result.error.message ?? "Could not create account"); return; }
    setSubmittedEmail(data.email); // 👈 "check your inbox" screen, no redirect
  };

  if (submittedEmail) {
    return (/* "Check your email — sent to {submittedEmail}", <button onClick={onDone}> to sign in */);
  }
  // …render: name/username/email fields + <PasswordInput> (eye toggle)
};
```

**Password reveal** — `src/components/ui/password-input.tsx` wraps the shadcn
`Input`, flips `type` between `password`/`text`, and toggles a `react-icons`
`LuEye`/`LuEyeOff` button. It forwards every native input prop (including the
`ref` from `register`), so forms use it as a drop-in:

```tsx
"use client";
import { useState } from "react";
import { LuEye, LuEyeOff } from "react-icons/lu";
import { Input } from "@/components/ui/input";

export const PasswordInput = ({ className, ...props }: React.ComponentProps<"input">) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input type={visible ? "text" : "password"} className={cn("pr-9", className)} {...props} />
      <button type="button" onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 flex items-center px-2.5 text-muted-foreground hover:text-foreground">
        {visible ? <LuEyeOff className="h-4 w-4" /> : <LuEye className="h-4 w-4" />}
      </button>
    </div>
  );
};
```

**Navbar modal** — `auth-modal.tsx` drops the same `AuthForm` into a `Dialog`;
the navbar renders `<AuthModal trigger={<Button>Sign in</Button>} />` instead of
linking to `/login`, so unauthenticated users get the auth surface without
leaving the page:

```tsx
"use client";
import type { AuthModalProps } from "@/lib/types";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { AuthForm } from "./auth-form";

export const AuthModal = ({ trigger, defaultTab = "signin", redirectTo = "/" }: AuthModalProps) => (
  <Dialog>
    <DialogTrigger render={trigger as React.ReactElement} />
    <DialogContent><AuthForm defaultTab={defaultTab} redirectTo={redirectTo} /></DialogContent>
  </Dialog>
);
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

## Step 13 — The admin area (RBAC, audit trail, user management)

**RBAC guard** — one reusable helper in `src/lib/helpers/session.ts`. Never
scatter `role === "admin"` string checks:

```ts
import { UserRole } from "@prisma/generated/client";

export const requireAdmin = cache(async () => {
  const session = await getServerSession();
  if (!session) redirect("/login?redirect=/admin");
  const user = session.user as typeof session.user & { role?: UserRole | null; banned?: boolean | null };
  if (user.banned) redirect("/login");
  if (user.role !== UserRole.admin) redirect("/");
  return session;
});
```

**Audit trail** — add an `AuditAction` enum + append-only `AuditLog` model to
`schema.prisma` (`bun run db:migrate --name add_audit_log`), then a best-effort
logger in `src/lib/audit.ts`:

```ts
export const logAudit = async (input: LogAuditInput): Promise<void> => {
  try { await prisma.auditLog.create({ data: input }); } catch { /* never break the request */ }
};
```

Login, logout, and signup are captured for free via `databaseHooks` in
`auth.ts` (logout uses `session.delete`, so admin session-revoke and expiry
count as logouts too):

```ts
databaseHooks: {
  session: {
    create: { after: async (s) => logAudit({ action: AuditAction.login,  actorId: s.userId, ipAddress: s.ipAddress, userAgent: s.userAgent }) },
    delete: { after: async (s) => logAudit({ action: AuditAction.logout, actorId: s.userId, ipAddress: s.ipAddress, userAgent: s.userAgent }) },
  },
  user: { create: { after: async (u) => logAudit({ action: AuditAction.signup, actorId: u.id, targetId: u.id, metadata: { email: u.email } }) } },
},
```

**Admin mutations** — server actions in `src/actions/admin/index.ts`, each
guarded + audited (`setUserRole`, `banUser`, `unbanUser`, `deleteUser`):

```ts
export const banUser = async (input: unknown) => {
  const { user } = await requireAdmin();
  const { userId, banReason } = banUserSchema.parse(input);
  if (userId === user.id) throw new Error("You can't ban your own account.");
  await auth.api.banUser({ headers: await headers(), body: { userId, banReason } });
  await logAudit({ action: AuditAction.user_banned, actorId: user.id, targetId: userId, ...(await requestMeta()) });
  revalidatePath("/admin/users");
};
```

**Layout + sidebar** — `admin/(protected)/layout.tsx` calls `requireAdmin()` and
renders `AdminSidebar` (hand-rolled shadcn-style, `usePathname` for active
links; the official shadcn sidebar block isn't in the base-ui registry):

```tsx
const AdminProtectedLayout = async ({ children }: { children: React.ReactNode }) => {
  await requireAdmin();
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
};
export default AdminProtectedLayout;
```

**Reads via API, writes via actions.** Admin pages **read** through GET route
handlers (`api/admin/dashboard|users|audit`, guarded by `getAdminSession()` →
403); each page is a thin server component rendering a client `*-view` that
fetches the endpoint with React Query. Mutations stay server actions; after one,
the client `invalidateQueries({ queryKey: ["admin"] })` to refetch (no
`revalidatePath`).

**Pages** (the dashboard is the `/admin` **index** — `admin/(protected)/page.tsx`,
not a `dashboard/` subroute):

- **`page.tsx`** → `<DashboardView>` — `StatCard`s (live users, totals, admins,
  banned, verified, new-24h) + an `AuditList` of recent activity.
- **`users/page.tsx`** → `<UsersView>` — `UsersTable` (shadcn `Table` + `Badge`)
  with `UserRowActions` (a `Button` kebab menu wired to the admin server actions).
- **`audit/page.tsx`** → `<AuditView>` — the last 100 events as a shadcn `Table`.

Pull the primitives via the CLI (base-ui `base-nova` style), declining
overwrites of customized files — then confirm destructive actions (delete user,
sign out) with the shared `ConfirmDialog` (built on `AlertDialog`), never
`window.confirm`:

```sh
bunx shadcn@latest add table badge alert-dialog --yes
```

> **Client-bundle trap:** `UserRowActions` is `"use client"`. Importing Prisma's
> `UserRole` *value* there pulls `node:async_hooks` into the browser and breaks
> the build — use the client-safe `ROLES` const from `@/lib/types` instead
> (enum *types* are fine; they're erased at compile time).

**UX wiring:**

- The dashboard is the `/admin` index; credential sign-in routes admins to
  `/admin` (read `role` off the `signIn` result).
- `AdminSidebar` is collapsible (icon-only) via local `useState`; the Dashboard
  link matches `/admin` exactly (not as a prefix).
- Sign-out **always confirms** through the shared `SignOutConfirm` dialog
  (`@/components/shared`), reused by the navbar avatar menu and the sidebar —
  never call `signOut()` straight from a button.
- The navbar avatar menu is role-aware: admins see an "Admin dashboard" link,
  everyone else sees profile links — and **every** signed-in user gets a
  confirmed "Sign out" entry.

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

For a production-style run (build the app, then serve it) use the root
`docker-compose.yml` + `Dockerfile` instead — it runs `db:deploy` then
`next start`, with no source bind-mount:

```sh
docker compose up --build
```

Then walk the flow:

1. **Sign up** at `/signup` (or the navbar **Sign in** modal → Sign up tab) → "check your email" screen (no session yet).
2. **Grab the link** — from your inbox, or (no SMTP) from the server console:
   `[email] SMTP_HOST not set … http://localhost:3000/api/auth/verify-email?token=…`
3. **Open the link** → verified, auto-signed-in, redirected to `/`.
4. **Log in** at `/login` with email *or* username (or Google).
5. **Admin:** `bun run make:admin you@example.com`, sign out/in, then visit
   `/admin` (stats + recent logins), `/admin/users` (change role /
   ban / delete), and `/admin/audit` (the trail — you should see your own login).

---

## What's next?

- Add more social providers in `auth.ts` (and document their env vars).
- Add `sendResetPassword` to `auth.ts` using the same `sendEmail` vendor for a
  password-reset flow.
- Put any new third-party client in `src/lib/vendors/<vendor>.ts`.
