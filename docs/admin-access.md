# Admin access

Admin access requires all of the following, checked server-side on every
privileged request by `requireAdmin()` in `src/lib/admin-auth.js`:

1. A valid JWT (`accessToken` cookie, `token` cookie, or `Authorization: Bearer`).
2. The user's **current database row** has `role = 'ADMIN'`.
3. The user's email is listed in the `ADMIN_EMAILS` environment variable.
4. The token's `sv` claim matches an HMAC of the user's current id, email,
   role, password hash and `ADMIN_SESSION_EPOCH`.

`src/middleware.js` also blocks `/admin/*` and `/api/admin/*` at the edge
(JWT with role `ADMIN` and an `sv` claim), and `src/app/admin/layout.jsx`
re-runs `requireAdmin()` before rendering any admin page except
`/admin/login`. The middleware is only a first filter; route handlers never
rely on it.

## Environment variables

| Name | Required | Purpose |
|---|---|---|
| `ADMIN_EMAILS` | Yes | Comma-separated verified admin emails (case-insensitive). If unset or empty, **nobody** has admin access. |
| `ADMIN_SESSION_EPOCH` | No (default `1`) | Change to any new value to invalidate every admin session immediately. |
| `JWT_SECRET` | Yes | Signs all session tokens. Rotating it signs everyone out. |

## Revoking admin sessions

- One admin: change their password, or demote them (any change to role or
  password invalidates their tokens).
- All admins: change `ADMIN_SESSION_EPOCH` and redeploy.
- Everyone (customers and scoopers too): rotate `JWT_SECRET` and redeploy.

Admin tokens issued before this mechanism existed have no `sv` claim and are
rejected everywhere.

## Managing ADMIN accounts

`scripts/admin-accounts.js` reads `DATABASE_URL` and `ADMIN_EMAILS` from the
environment. Commands that write are dry runs unless `--apply` is passed. The
script prints which database host it is connected to; check it before using
`--apply`.

```bash
# List every ADMIN user and whether it is allowlisted
node scripts/admin-accounts.js list

# Show which ADMIN users are not in ADMIN_EMAILS, then demote them
node scripts/admin-accounts.js demote-unverified
node scripts/admin-accounts.js demote-unverified --apply
# Demoted accounts get role SUSPENDED by default; use --role=CUSTOMER to override

# Make an existing (normally signed-up) account an admin; must be in ADMIN_EMAILS
node scripts/admin-accounts.js promote owner@example.com
node scripts/admin-accounts.js promote owner@example.com --apply
```

`demote-unverified` refuses to run when `ADMIN_EMAILS` is empty.

To run against production, pull the production env locally first (for
example `vercel env pull .env.production.local`, then
`set -a; source .env.production.local; set +a`) and confirm the printed
database host before adding `--apply`.

## Tests

```bash
npm run test:security
```

Runs `src/__tests__/admin-access.test.js` (middleware, admin layout, signup,
admin login and admin route handlers against an in-memory Prisma mock).
