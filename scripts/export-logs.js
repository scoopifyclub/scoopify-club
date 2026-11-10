#!/usr/bin/env node
/**
 * Download SystemLog rows written since the last run into local JSONL files,
 * one file per UTC day: logs/systemlog/YYYY-MM-DD.jsonl
 *
 *   node scripts/export-logs.js                 # everything new since the last export
 *   node scripts/export-logs.js --types SERVER_ # only rows whose type starts with SERVER_
 *   node scripts/export-logs.js --since 2026-11-01T00:00:00Z   # first run only
 *   node scripts/export-logs.js --out D:\scoopify-logs --dry-run
 *
 * Connection: LOG_EXPORT_DATABASE_URL (preferred, ideally a read-only Neon role),
 * else DATABASE_URL. Read from the environment, or from .env.local / .env in the
 * repo root. The session is forced read-only, so the script cannot modify data.
 *
 * Idempotent: progress is stored in <out>/.export-cursor.json and every row id
 * already present in a day file is skipped, so re-running (or crashing mid-run)
 * never duplicates lines. A lock file stops overlapping scheduled runs.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BATCH_SIZE = 2000;
const LOCK_STALE_MS = 60 * 60 * 1000;
const EPOCH = '1970-01-01T00:00:00.000Z';

function parseArgs(argv) {
  const args = { out: process.env.LOG_EXPORT_DIR || path.join(ROOT, 'logs', 'systemlog'), types: [], dryRun: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => {
      const value = argv[i + 1];
      if (value === undefined) throw new Error(`${arg} needs a value`);
      i += 1;
      return value;
    };
    if (arg === '--out') args.out = path.resolve(next());
    else if (arg === '--types') args.types = next().split(',').map((t) => t.trim()).filter(Boolean);
    else if (arg === '--since') args.since = new Date(next()).toISOString();
    else if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--help' || arg === '-h') args.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

async function loadDatabaseUrl() {
  try {
    const dotenv = await import('dotenv');
    for (const file of ['.env.local', '.env']) {
      const full = path.join(ROOT, file);
      if (fs.existsSync(full)) dotenv.config({ path: full, override: false, quiet: true });
    }
  } catch {
    // dotenv is a devDependency; without it only real environment variables are used
  }
  return process.env.LOG_EXPORT_DATABASE_URL || process.env.DATABASE_URL;
}

function describeTarget(databaseUrl) {
  try {
    const url = new URL(databaseUrl);
    return `${url.hostname}${url.pathname}`;
  } catch {
    return 'database';
  }
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJsonAtomic(file, value) {
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(tmp, file);
}

function acquireLock(lockFile) {
  try {
    fs.writeFileSync(lockFile, JSON.stringify({ pid: process.pid, at: new Date().toISOString() }), { flag: 'wx' });
    return true;
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    const age = Date.now() - fs.statSync(lockFile).mtimeMs;
    if (age < LOCK_STALE_MS) return false;
    fs.rmSync(lockFile, { force: true });
    return acquireLock(lockFile);
  }
}

const knownIds = new Map();
function idsInFile(file) {
  if (knownIds.has(file)) return knownIds.get(file);
  const ids = new Set();
  if (fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      if (!line) continue;
      try {
        ids.add(JSON.parse(line).id);
      } catch {
        // a partially written last line from a crash; the row is re-exported
      }
    }
  }
  knownIds.set(file, ids);
  return ids;
}

function ensureTrailingNewline(file) {
  if (!fs.existsSync(file)) return;
  const size = fs.statSync(file).size;
  if (size === 0) return;
  const fd = fs.openSync(file, 'r');
  const buf = Buffer.alloc(1);
  fs.readSync(fd, buf, 0, 1, size - 1);
  fs.closeSync(fd);
  if (buf[0] !== 0x0a) fs.appendFileSync(file, '\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0]);
    return 0;
  }

  const databaseUrl = await loadDatabaseUrl();
  if (!databaseUrl) {
    console.error('Set LOG_EXPORT_DATABASE_URL or DATABASE_URL (environment, .env.local or .env).');
    return 2;
  }

  fs.mkdirSync(args.out, { recursive: true });
  const cursorFile = path.join(args.out, '.export-cursor.json');
  const lockFile = path.join(args.out, '.export.lock');
  if (!args.dryRun && !acquireLock(lockFile)) {
    console.error(`Another export is running (lock: ${lockFile}). Exiting.`);
    return 3;
  }

  // timestamp(3) columns hold UTC values written by Prisma; parse them as UTC.
  pg.types.setTypeParser(1114, (value) => new Date(`${value.replace(' ', 'T')}Z`));
  const client = new pg.Client({
    connectionString: databaseUrl,
    application_name: 'scoopify-log-export',
    statement_timeout: 60_000,
  });

  const saved = readJson(cursorFile, null);
  let cursor = saved?.lastCreatedAt
    ? { createdAt: saved.lastCreatedAt, id: saved.lastId ?? '' }
    : { createdAt: args.since ?? EPOCH, id: '' };

  let exported = 0;
  let skipped = 0;
  const touched = new Set();

  try {
    await client.connect();
    // Per-transaction rather than per-session so it also holds on Neon's pooled (PgBouncer) URL.
    const readOnlyQuery = async (sql, params) => {
      await client.query('BEGIN TRANSACTION READ ONLY');
      try {
        const result = await client.query(sql, params);
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        throw error;
      }
    };

    const typeFilter = args.types.length ? 'AND type LIKE ANY($4::text[])' : '';
    const sql = `SELECT id, type, message, data, "createdAt"
                   FROM "SystemLog"
                  WHERE ("createdAt", id) > ($1::timestamptz AT TIME ZONE 'UTC', $2::text) ${typeFilter}
                  ORDER BY "createdAt", id
                  LIMIT $3`;

    for (;;) {
      const params = [cursor.createdAt, cursor.id, BATCH_SIZE];
      if (args.types.length) params.push(args.types.map((t) => `${t.replace(/[%_\\]/g, '\\$&')}%`));
      const { rows } = await readOnlyQuery(sql, params);
      if (rows.length === 0) break;

      const byDay = new Map();
      for (const row of rows) {
        const createdAt = row.createdAt.toISOString();
        const file = path.join(args.out, `${createdAt.slice(0, 10)}.jsonl`);
        const ids = idsInFile(file);
        if (ids.has(row.id)) {
          skipped += 1;
          continue;
        }
        ids.add(row.id);
        const line = JSON.stringify({ id: row.id, createdAt, type: row.type, message: row.message, data: row.data });
        if (!byDay.has(file)) byDay.set(file, []);
        byDay.get(file).push(line);
      }

      if (!args.dryRun) {
        for (const [file, lines] of byDay) {
          ensureTrailingNewline(file);
          fs.appendFileSync(file, `${lines.join('\n')}\n`);
          touched.add(file);
        }
      }
      for (const lines of byDay.values()) exported += lines.length;

      const last = rows[rows.length - 1];
      cursor = { createdAt: last.createdAt.toISOString(), id: last.id };
      if (!args.dryRun) {
        writeJsonAtomic(cursorFile, {
          lastCreatedAt: cursor.createdAt,
          lastId: cursor.id,
          lastRunAt: new Date().toISOString(),
        });
      }
      if (rows.length < BATCH_SIZE) break;
    }
  } finally {
    await client.end().catch(() => {});
    if (!args.dryRun) fs.rmSync(lockFile, { force: true });
  }

  const verb = args.dryRun ? 'Would export' : 'Exported';
  console.log(
    `${verb} ${exported} new row(s) from ${describeTarget(databaseUrl)}` +
      `${skipped ? `, skipped ${skipped} already on disk` : ''} -> ${args.out}` +
      (touched.size ? ` (${[...touched].map((f) => path.basename(f)).join(', ')})` : ''),
  );
  return 0;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    const raw = error?.message || error?.errors?.[0]?.message || error?.code || String(error);
    const message = String(raw).replace(/\b(postgres(?:ql)?):\/\/[^\s'"]+/gi, '$1://[REDACTED]');
    console.error(`Log export failed: ${message}`);
    process.exitCode = 1;
  });
