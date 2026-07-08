# `src/app/`

The Next.js **App Router**. Folders map to URL segments; `page.tsx` renders a
route, `layout.tsx` wraps its subtree. Folders in `(parentheses)` are **route
groups** — they organize files and apply a shared layout **without** adding a URL
segment.

## Routes

| Path on disk | URL | Notes |
|--------------|-----|-------|
| `(auth)/login` | `/login` | Unified sign-in (email **or** username + password, + Google). Reads `?redirect=`. |
| `(auth)/signup` | `/signup` | Registration (name, username, email, password, + Google). Creates `role: "user"`. |
| `(public)/landing` | `/landing` | Reachable without a session. |
| `profile/view` | `/profile/view` | Protected — `profile/layout.tsx` redirects to `/login` when unauthenticated. |
| `profile/edit` | `/profile/edit` | Protected profile editing. |
| `admin/login` | — | **Removed.** Admins sign in at `/login`; the guard redirects there. |
| `admin/(protected)/dashboard` | `/admin/dashboard` | Requires `role === "admin"` (checked in `admin/(protected)/layout.tsx`); otherwise redirects to `/landing`. |
| `api/auth/[...all]` | `/api/auth/*` | Better Auth catch-all handler. |

> ⚠️ A route group adds no URL segment. `profile/` is a **real** segment
> (`/profile/...`); if you wrap it in `(profile)` the pages move to `/view` and
> `/edit` and every `/profile/*` link 404s.

## Guards

Protection lives in `layout.tsx` files using `getServerSession()` from
[`@/lib/helpers`](../lib/helpers). Route handlers under `api/` are reachable by
direct HTTP, so **verify the session inside every handler** — a layout guard does
not protect them.

## Adding a route

1. Create `app/<segment>/page.tsx` (async Server Component by default).
2. For a protected area, add a `layout.tsx` that calls `getServerSession()` and
   `redirect()`s when the check fails.
3. Use `(group)` folders only to share a layout without changing the URL.
