#!/usr/bin/env node
// Runs `prisma migrate deploy` during the Vercel build.
//
// Only production builds migrate: preview builds may point at the production
// database, and must not apply migrations from unmerged branches. Set
// RUN_MIGRATIONS=1 to migrate on another environment (for example a preview
// that has its own Neon branch), or SKIP_MIGRATIONS=1 to skip in production.
//
// Migrations need a direct (non-pooled) connection, so DIRECT_URL is
// preferred over DATABASE_URL, and a Neon "-pooler" host is rewritten to its
// direct host.
//
// Any failure exits non-zero so the build fails and the previous deployment
// keeps serving. On a database that has not been baselined yet, Prisma
// refuses with P3005 and changes nothing (see docs/database-migrations.md).

import { spawnSync } from 'node:child_process';

const truthy = (value) => ['1', 'true', 'yes'].includes(String(value || '').toLowerCase());

function shouldMigrate() {
  if (truthy(process.env.SKIP_MIGRATIONS)) return [false, 'SKIP_MIGRATIONS is set'];
  if (truthy(process.env.RUN_MIGRATIONS)) return [true, 'RUN_MIGRATIONS is set'];
  if (!process.env.VERCEL) return [false, 'not a Vercel build (set RUN_MIGRATIONS=1 to migrate)'];
  if (process.env.VERCEL_ENV !== 'production') {
    return [false, `VERCEL_ENV is "${process.env.VERCEL_ENV}", not "production"`];
  }
  return [true, 'production build'];
}

function directUrl() {
  const raw = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.hostname.includes('-pooler.')) {
      url.hostname = url.hostname.replace('-pooler.', '.');
      url.searchParams.delete('pgbouncer');
      console.log('[migrate] Using the direct Neon host instead of the pooled one.');
      return url.toString();
    }
  } catch {
    // Leave unparseable URLs for Prisma to report.
  }
  return raw;
}

const [run, reason] = shouldMigrate();
if (!run) {
  console.log(`[migrate] Skipping prisma migrate deploy: ${reason}.`);
  process.exit(0);
}

const url = directUrl();
if (!url) {
  console.error('[migrate] DIRECT_URL or DATABASE_URL must be set to run migrations.');
  process.exit(1);
}

console.log(`[migrate] Running prisma migrate deploy (${reason}).`);
const result = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: url },
});
if (result.status !== 0) {
  console.error('[migrate] prisma migrate deploy failed; failing the build.');
  process.exit(result.status ?? 1);
}
