#!/usr/bin/env node
/**
 * Capture Vercel production runtime logs to local files while this machine is on.
 * Start it through scripts/tail-vercel-logs.ps1 (Windows) or scripts/tail-vercel-logs.sh.
 *
 * Current Vercel CLIs have no follow mode for `vercel logs`, and Hobby keeps only
 * about 30 minutes of runtime logs, so this polls `vercel logs --json` every
 * VERCEL_LOG_POLL_SECONDS, de-duplicates, and appends new records as JSON lines to
 * logs/vercel/vercel-<env>-YYYY-MM-DD.jsonl (UTC day; rolls to .1, .2… past
 * VERCEL_LOG_MAX_MB). Files older than VERCEL_LOG_KEEP_DAYS are deleted.
 * Downtime shorter than ~30 minutes is back-filled on restart; longer gaps are
 * recorded as {"gap":…} lines.
 *
 *   node scripts/tail-vercel-logs.js          # poll until Ctrl+C
 *   node scripts/tail-vercel-logs.js --once   # one poll, then exit (for Task Scheduler / cron)
 *
 * Environment:
 *   VERCEL_TOKEN (required)   personal token from https://vercel.com/account/tokens
 *   VERCEL_PROJECT            default scoopify-club
 *   VERCEL_SCOPE              team id/slug owning the project (default: the Scoopify team)
 *   VERCEL_LOG_ENV            default production
 *   VERCEL_LOG_POLL_SECONDS   default 60
 *   VERCEL_LOG_DIR            default <repo>/logs/vercel
 *   VERCEL_LOG_MAX_MB         default 50
 *   VERCEL_LOG_KEEP_DAYS      default 30
 *   VERCEL_CLI                command used to run the CLI (default: `vercel` if installed, else `npx --yes vercel@latest`)
 */
import { spawn, spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IS_WINDOWS = process.platform === 'win32';
const RETENTION_MS = 29 * 60 * 1000;
// Re-query this much before the last poll so records Vercel ingests late are still picked up.
const OVERLAP_MS = 2 * 60 * 1000;
const PAGE_LIMIT = 1000;
const MAX_PAGES = 30;

const intEnv = (name, fallback) => {
  const n = Number.parseInt(process.env[name] ?? '', 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const config = {
  project: process.env.VERCEL_PROJECT || 'scoopify-club',
  scope: process.env.VERCEL_SCOPE || 'team_8TNsS21ewUNryFUXRYe6wJ2I',
  environment: process.env.VERCEL_LOG_ENV || 'production',
  pollMs: intEnv('VERCEL_LOG_POLL_SECONDS', 60) * 1000,
  dir: path.resolve(process.env.VERCEL_LOG_DIR || path.join(ROOT, 'logs', 'vercel')),
  maxBytes: intEnv('VERCEL_LOG_MAX_MB', 50) * 1024 * 1024,
  keepDays: intEnv('VERCEL_LOG_KEEP_DAYS', 30),
  once: process.argv.includes('--once'),
};
const stateFile = path.join(config.dir, '.tail-state.json');

function resolveCli() {
  if (process.env.VERCEL_CLI) return process.env.VERCEL_CLI.split(' ').filter(Boolean);
  const probe = spawnSync(IS_WINDOWS ? 'where' : 'which', ['vercel'], { stdio: 'ignore', shell: IS_WINDOWS });
  return probe.status === 0 ? ['vercel'] : ['npx', '--yes', 'vercel@latest'];
}
const CLI = resolveCli();

function runCli(args) {
  return new Promise((resolve) => {
    const [cmd, ...pre] = CLI;
    const child = spawn(cmd, [...pre, ...args], {
      cwd: ROOT,
      env: process.env,
      shell: IS_WINDOWS,
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', (error) => resolve({ code: -1, stdout, stderr: String(error.message) }));
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

function parseJsonLines(text) {
  const records = [];
  let summary = null;
  let error = null;
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim().startsWith('{')) continue;
    let parsed;
    try {
      parsed = JSON.parse(line);
    } catch {
      continue;
    }
    if (parsed.type === 'log' && parsed.data) records.push(parsed.data);
    else if (parsed.type === 'summary') summary = parsed;
    else if (parsed.status === 'error') error = parsed;
  }
  return { records, summary, error };
}

async function fetchWindow(sinceIso) {
  const records = [];
  let args = [
    'logs', '--json',
    '--project', config.project,
    '--scope', config.scope,
    '--environment', config.environment,
    '--since', sinceIso,
    '--limit', String(PAGE_LIMIT),
  ];
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const result = await runCli(args);
    const parsed = parseJsonLines(result.stdout);
    if (parsed.error) {
      throw new Error(`${parsed.error.message}${parsed.error.data?.serverMessage ? ` (${parsed.error.data.serverMessage})` : ''}`);
    }
    if (result.code !== 0 && parsed.records.length === 0) {
      throw new Error(`vercel logs exited ${result.code}: ${result.stderr.trim().split('\n').slice(-3).join(' | ')}`);
    }
    records.push(...parsed.records);
    const next = parsed.summary?.pagination?.hasMore ? parsed.summary.pagination.next : null;
    if (!next) break;
    args = ['logs', '--json', '--next', next];
  }
  return records;
}

function readState() {
  try {
    return JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  } catch {
    return {};
  }
}

function writeState(state) {
  fs.writeFileSync(`${stateFile}.tmp`, JSON.stringify(state));
  fs.renameSync(`${stateFile}.tmp`, stateFile);
}

function recordKey(r) {
  return crypto
    .createHash('sha1')
    .update(`${r.timestamp}|${r.requestId}|${r.deploymentId}|${r.source}|${r.stream}|${r.message}`)
    .digest('base64url');
}

function fileFor(dayIso) {
  const base = path.join(config.dir, `vercel-${config.environment}-${dayIso}.jsonl`);
  try {
    if (fs.statSync(base).size >= config.maxBytes) {
      let n = 1;
      while (fs.existsSync(base.replace(/\.jsonl$/, `.${n}.jsonl`))) n += 1;
      fs.renameSync(base, base.replace(/\.jsonl$/, `.${n}.jsonl`));
    }
  } catch {
    // file does not exist yet
  }
  return base;
}

function appendLines(lines) {
  const byDay = new Map();
  for (const { day, line } of lines) {
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day).push(line);
  }
  const files = [];
  for (const [day, dayLines] of byDay) {
    const file = fileFor(day);
    fs.appendFileSync(file, `${dayLines.join('\n')}\n`);
    files.push(path.basename(file));
  }
  return files;
}

function deleteOldFiles() {
  const cutoff = Date.now() - config.keepDays * 86_400_000;
  for (const name of fs.readdirSync(config.dir)) {
    if (!name.startsWith('vercel-') || !name.endsWith('.jsonl')) continue;
    const full = path.join(config.dir, name);
    if (fs.statSync(full).mtimeMs < cutoff) fs.rmSync(full, { force: true });
  }
}

const stamp = () => new Date().toLocaleTimeString();

async function poll(state, seen) {
  const now = Date.now();
  const floor = now - RETENTION_MS;
  const covered = state.coveredUntil ? Date.parse(state.coveredUntil) : null;
  const lines = [];

  if (covered && covered - OVERLAP_MS < floor) {
    const gap = { gap: { from: new Date(covered).toISOString(), to: new Date(floor).toISOString() }, note: 'logs in this window were not captured' };
    lines.push({ day: gap.gap.to.slice(0, 10), line: JSON.stringify(gap) });
    console.warn(`[${stamp()}] gap: nothing captured between ${gap.gap.from} and ${gap.gap.to}`);
  }

  const since = new Date(Math.max(floor, (covered ?? floor) - OVERLAP_MS)).toISOString();
  const records = await fetchWindow(since);
  records.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));

  for (const record of records) {
    const key = recordKey(record);
    if (seen.has(key)) continue;
    const ts = Date.parse(record.timestamp);
    seen.set(key, ts);
    lines.push({ day: new Date(ts).toISOString().slice(0, 10), line: JSON.stringify(record) });
  }
  for (const [key, ts] of seen) if (ts < Date.parse(since) - OVERLAP_MS) seen.delete(key);

  const files = lines.length ? appendLines(lines) : [];
  state.coveredUntil = new Date(now).toISOString();
  state.lastPollAt = new Date().toISOString();
  state.recentKeys = [...seen.entries()];
  writeState(state);
  console.log(`[${stamp()}] ${records.length} fetched, ${lines.length} new${files.length ? ` -> ${files.join(', ')}` : ''}`);
}

async function main() {
  if (!process.env.VERCEL_TOKEN) {
    console.error('VERCEL_TOKEN is not set. Create one at https://vercel.com/account/tokens (see docs/logging.md).');
    return 2;
  }
  fs.mkdirSync(config.dir, { recursive: true });
  const state = readState();
  const seen = new Map(Array.isArray(state.recentKeys) ? state.recentKeys : []);
  console.log(
    `Capturing ${config.environment} logs for ${config.project} into ${config.dir}` +
      (config.once ? ' (single poll)' : ` every ${config.pollMs / 1000}s; Ctrl+C to stop`),
  );

  let stopping = false;
  let wake = null;
  process.on('SIGINT', () => {
    stopping = true;
    console.log('Stopping…');
    if (config.once) process.exit(130);
    wake?.();
  });

  let lastCleanup = 0;
  for (;;) {
    try {
      await poll(state, seen);
    } catch (error) {
      if (stopping) return 0;
      console.error(`[${stamp()}] poll failed: ${error.message}`);
      if (config.once) return 1;
    }
    if (Date.now() - lastCleanup > 3_600_000) {
      lastCleanup = Date.now();
      try {
        deleteOldFiles();
      } catch (error) {
        console.error(`cleanup failed: ${error.message}`);
      }
    }
    if (config.once || stopping) return 0;
    await new Promise((resolve) => {
      const timer = setTimeout(resolve, config.pollMs);
      wake = () => {
        clearTimeout(timer);
        resolve();
      };
    });
    wake = null;
    if (stopping) return 0;
  }
}

main().then((code) => {
  process.exitCode = code;
});
