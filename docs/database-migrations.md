# Database migrations

Schema changes ship as Prisma migrations in `prisma/migrations/`. The first
migration, `0_init`, is a baseline: it creates the whole schema exactly as
`prisma/schema.prisma` describes it at the time migrations were introduced.

## How deploys apply migrations

`vercel.json` runs `npm run vercel-build`, which is:

```
prisma generate && node scripts/migrate-deploy.js && next build
```

`scripts/migrate-deploy.js` runs `prisma migrate deploy` only on production
builds (`VERCEL_ENV=production`). Preview builds skip it, because a preview may
use the production database and must not apply migrations from an unmerged
branch.

| Variable | Effect |
| --- | --- |
| `DIRECT_URL` | Non-pooled connection used for migrations. Falls back to `DATABASE_URL`. A Neon `-pooler` host is rewritten to the direct host. |
| `SKIP_MIGRATIONS=1` | Emergency switch: production builds skip `migrate deploy`. |
| `RUN_MIGRATIONS=1` | Migrate on a non-production build, for example a preview with its own Neon branch. |

If `migrate deploy` fails, the build fails and the previous deployment keeps
serving. `npm run build` (local) never migrates.

## One-time production baseline

Production was built with `prisma db push`, so it has the tables but no
`_prisma_migrations` history. Until it is baselined, a production build will
stop with `Error: P3005 The database schema is not empty`. That failure is
safe: nothing is changed and the old deployment keeps serving. Still, do the
steps below **before this change is deployed to production**.

Baselining only records `0_init` as already applied. It does not run any SQL
against the app's tables. The diff in step 4 is what proves `0_init` really
matches production.

You need:

- Neon console access to the production project.
- `psql` and `pg_dump` at the same major version as the server, or newer.
- This repository checked out at the migrations commit, with `npm ci` run.

Run everything from the repository root in one shell.

### 1. Get the direct production URL

In the Neon console, open the project, choose **Connect**, select the
production branch and database, and turn **Connection pooling off**. The host
must not contain `-pooler`.

```bash
export PROD_URL='postgresql://USER:PASSWORD@ep-XXXX.REGION.aws.neon.tech/DBNAME?sslmode=require'
psql "$PROD_URL" -Atc 'show server_version'
```

### 2. Back up first

Do both of these:

1. **Neon branch (fast restore point).** Console → **Branches** → **Create
   branch**. Set the parent to the production branch, choose "Current point
   in time", and name it `pre-migrations-baseline-YYYY-MM-DD`. With the CLI:
   `neonctl branches create --project-id <id> --parent <prod-branch> --name pre-migrations-baseline-YYYY-MM-DD`.
2. **Logical dump (off-Neon copy).**

```bash
pg_dump "$PROD_URL" --format=custom --no-owner --no-privileges \
  --file "scoopify-prod-$(date -u +%Y%m%dT%H%MZ).dump"
pg_restore --list scoopify-prod-*.dump | head -20
```

Keep the dump somewhere private. It contains customer data.

### 3. Confirm production is not baselined yet

```bash
psql "$PROD_URL" -c 'select migration_name, finished_at from _prisma_migrations'
```

Expected: `ERROR: relation "_prisma_migrations" does not exist`. If the table
exists, stop and ask before continuing.

### 4. Diff production against the baseline (read-only)

```bash
npx prisma migrate diff \
  --from-url "$PROD_URL" \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prod-vs-baseline.sql
cat prod-vs-baseline.sql
```

`prisma/schema.prisma` and `0_init` are verified identical, so this is the
diff against `0_init`. The command only reads the database. The output is the
SQL that *would* turn production into the baseline. It is DDL only (no data),
so it is safe to share. **Do not run it.**

Read it like this:

- **Only `-- This is an empty migration.`**: production matches. Go to step 5.
- **Only the known script drift below**: this is expected if the old
  `scripts/add-*` scripts were run against production. It is harmless to
  baseline anyway. Go to step 5, and send `prod-vs-baseline.sql` to the
  developer, who will add a follow-up migration that settles those indexes
  and column types.

```sql
DROP INDEX "Payment_stripePaymentIntentId_idx";
DROP INDEX "Service_scheduledDate_idx";
DROP INDEX "Service_status_idx";
DROP INDEX "User_emailVerified_idx";
ALTER TABLE "Service" ALTER COLUMN "isLocked" SET NOT NULL,
ALTER COLUMN "unlockedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "lockExpiresAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "claimedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "arrivalDeadline" SET DATA TYPE TIMESTAMP(3);
```

  Any subset of those lines also counts as known drift.

- **Anything else**: **stop, do not baseline.** Send `prod-vs-baseline.sql` to
  the developer. `DROP TABLE` or `DROP COLUMN` means production has tables or
  columns that the schema doesn't know about, and they may hold data.
  `CREATE TABLE` or `ADD COLUMN` means production is missing something the
  code expects. Either way, a drift migration has to be written from this
  diff first.

### 5. Mark the baseline as applied

```bash
DATABASE_URL="$PROD_URL" npx prisma migrate resolve --applied 0_init
```

Expected: `Migration 0_init marked as applied.` This creates
`_prisma_migrations` and inserts one row. No other table is touched.

### 6. Verify

```bash
DATABASE_URL="$PROD_URL" npx prisma migrate status
```

Expected: `Database schema is up to date!`

### 7. Deploy

Optionally, set `DIRECT_URL` to the direct URL from step 1 in Vercel →
Settings → Environment Variables → Production. Without it, the build derives
the direct host from `DATABASE_URL`. Then merge and deploy. The production
build log should show `[migrate] Running prisma migrate deploy (production
build).` followed by `No pending migrations to apply.`

### Rehearsal (recommended)

Run steps 3–6 against a throwaway Neon branch of production first, using that
branch's direct URL as `PROD_URL`. Then run
`DATABASE_URL="$PROD_URL" npx prisma migrate deploy` on it to confirm it
reports no pending migrations. Delete the branch afterwards.

### Undo

To un-baseline, remove the history row. App tables are unaffected:

```bash
psql "$PROD_URL" -c "delete from _prisma_migrations where migration_name = '0_init'"
```

If anything else went wrong, restore from the Neon branch made in step 2.

## Changing the schema from now on

1. Edit `prisma/schema.prisma`.
2. Against a local or dev database (never production), run
   `npx prisma migrate dev --name short_description`. This writes
   `prisma/migrations/<timestamp>_short_description/migration.sql`.
3. Review the SQL, especially `DROP` and `NOT NULL` changes on tables with
   data, and commit it with the schema change.
4. On merge, the production build applies it with `prisma migrate deploy`.

Do not use `prisma db push` or ad-hoc `ALTER TABLE` scripts against
production. They change the schema without a migration and create drift.
