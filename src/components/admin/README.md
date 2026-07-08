# `src/components/admin/`

Client components for the admin area
([`app/admin/(protected)/`](../../app)). Exported via `index.ts`.

| Component | Role |
|-----------|------|
| `AdminSignOutButton` | Signs out and returns to `/login`. |

## Notes

- There is **no admin login form** — admins authenticate through the unified
  `/login` page. Authorization is enforced by the `role === "admin"` check in
  `app/admin/(protected)/layout.tsx`, not by a separate login.
- Admin components render inside the protected layout, so they can assume an
  authenticated admin session — but any new **API route** must still re-check it.
