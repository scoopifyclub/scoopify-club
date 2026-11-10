# Durable logging on Vercel Hobby

Vercel Hobby keeps runtime logs for about **45 minutes** and has **no log drains**. This setup keeps errors in Neon (free tier) and downloads them to your PC so nothing important disappears.

Three pieces, all free:

1. **Server error capture** — Next.js `onRequestError` writes redacted rows into the existing `SystemLog` table.
2. **`scripts/export-logs.js`** — pulls those rows into local dated JSONL files (idempotent, schedule daily).
3. **`scripts/tail-vercel-logs`** — while your PC is on, polls `vercel logs` and appends production runtime lines locally (Hobby has no follow mode, so the script polls).

Optional: Sentry free tier as an alert channel (documented at the bottom; off unless `SENTRY_DSN` is set).

## 1. What lands in the database

Uncaught server errors (route handlers, server components, server actions) call [`src/instrumentation.js`](../src/instrumentation.js) → [`src/lib/server-log.js`](../src/lib/server-log.js). Each row:

| Field | Where |
| --- | --- |
| `type` | `SERVER_ERROR` (also `SERVER_WARN` / `SERVER_INFO` for manual calls) |
| `message` | Redacted error message |
| `data` (JSON) | `route`, `path`, `method`, `status`, `requestId`, `timestamp`, `stack`, plus runtime/deploy metadata |
| `createdAt` | Set by Postgres |

**Never logged:** secrets, tokens, passwords, gate codes, card data, cookies, Authorization headers, or full request bodies. Query strings are stripped from paths. Writes are time-boxed (default 1.5s), rate-limited (default 30/min per instance), and **fail open** — a slow or dead DB never breaks the request.

Routes can also call:

```js
import { logServerError, logServerEvent } from '@/lib/server-log';

await logServerError(error, { request, route: '/api/…', status: 500 });
await logServerEvent('warn', 'webhook retried', { eventId });
```

### Retention (Neon storage)

`SERVER_*` rows older than **`SYSTEM_LOG_RETENTION_DAYS`** (default **30**) are deleted. Every successful write may trigger a prune check at most once every `SERVER_LOG_PRUNE_INTERVAL_HOURS` (default 6). Other `SystemLog` types (automation triggers, etc.) are left alone.

| Env var | Default | Purpose |
| --- | --- | --- |
| `SERVER_LOG_DB` | on | Set `off` to disable DB writes |
| `SERVER_LOG_TIMEOUT_MS` | `1500` | Max wait for a log write |
| `SERVER_LOG_MAX_PER_MINUTE` | `30` | Cap per serverless instance |
| `SYSTEM_LOG_RETENTION_DAYS` | `30` | Prune age for `SERVER_*` rows |
| `SERVER_LOG_PRUNE_INTERVAL_HOURS` | `6` | How often an instance runs the prune |

No new table or migration is required — this uses the existing `SystemLog` (`id`, `type`, `message`, `data`, `createdAt`).

---

## 2. Export SystemLog to your PC (`export-logs.js`)

```bash
# from the repo root, with DATABASE_URL (or LOG_EXPORT_DATABASE_URL) available
npm run logs:export
# or:
node scripts/export-logs.js
node scripts/export-logs.js --types SERVER_
node scripts/export-logs.js --out D:\scoopify-logs
node scripts/export-logs.js --dry-run
```

Writes `logs/systemlog/YYYY-MM-DD.jsonl` (UTC day). Progress lives in `.export-cursor.json` next to those files. Re-runs skip row ids already on disk, so the job is **idempotent**.

Prefer a **read-only Neon role** in `LOG_EXPORT_DATABASE_URL` if you create one; otherwise `DATABASE_URL` works. Every batch runs inside `BEGIN TRANSACTION READ ONLY`.

### Windows Task Scheduler (recommended — this repo has `dev.ps1`)

1. Put your DB URL in a **User** env var (not a shared file if you can avoid it):

   ```powershell
   [Environment]::SetEnvironmentVariable(
     'LOG_EXPORT_DATABASE_URL',
     'postgresql://…',   # Neon connection string
     'User')
   ```

2. Open **Task Scheduler** → Create Task…
   - **General:** name `Scoopify export SystemLog`; “Run whether user is logged on or not” is fine; run with highest privileges only if needed.
   - **Triggers:** Daily, e.g. 7:00 AM (America/Denver). Add a second trigger at login if you want a catch-up when the PC was off.
   - **Actions:** Start a program
     - Program: `node` (full path if needed, e.g. `C:\Program Files\nodejs\node.exe`)
     - Arguments: `scripts\export-logs.js --types SERVER_`
     - Start in: your clone path, e.g. `C:\Users\Matthew\src\scoopify-club`
   - **Conditions:** uncheck “Start only if on AC power” if this is a laptop you leave plugged in overnight.

3. Run the task once by hand and confirm files appear under `logs\systemlog\`.

### macOS / Linux cron

```bash
# every day at 07:00 local time
0 7 * * * cd /path/to/scoopify-club && /usr/bin/node scripts/export-logs.js --types SERVER_ >>logs/export.log 2>&1
```

Export `LOG_EXPORT_DATABASE_URL` (or `DATABASE_URL`) in the crontab environment or a small wrapper script that `source`s it.

---

## 3. Live Vercel runtime capture (`tail-vercel-logs`)

Hobby has no streaming follow for `vercel logs`, so this **polls** every 60s (configurable), de-duplicates, and appends to:

`logs/vercel/vercel-production-YYYY-MM-DD.jsonl`

Files rotate past 50 MB and are deleted after 30 days. If the PC was off longer than Hobby’s retention (~30–45 min), a `{"gap":…}` line is written so you know what was missed.

### One-time setup (any OS)

1. Create a token at [vercel.com/account/tokens](https://vercel.com/account/tokens) (scope: the team that owns `scoopify-club`).
2. Store it as a **User** environment variable named `VERCEL_TOKEN` (never commit it).

Windows PowerShell:

```powershell
$t = Read-Host 'Vercel token'
[Environment]::SetEnvironmentVariable('VERCEL_TOKEN', $t, 'User')
# open a new terminal, then:
.\scripts\tail-vercel-logs.ps1
```

macOS / Linux:

```bash
export VERCEL_TOKEN=…   # or put it in ~/.bashrc / a secrets file
./scripts/tail-vercel-logs.sh
# one poll only:
./scripts/tail-vercel-logs.sh --once
```

Optional env vars: `VERCEL_PROJECT`, `VERCEL_SCOPE`, `VERCEL_LOG_ENV`, `VERCEL_LOG_POLL_SECONDS`, `VERCEL_LOG_DIR`, `VERCEL_LOG_MAX_MB`, `VERCEL_LOG_KEEP_DAYS` (see the header of `scripts/tail-vercel-logs.js`).

### Keep it running on Windows

**While working:** leave a terminal open with `.\scripts\tail-vercel-logs.ps1`.

**Background / at logon (Task Scheduler):**

- Trigger: At log on
- Action: `powershell.exe`
- Arguments: `-NoProfile -ExecutionPolicy Bypass -File C:\path\to\scoopify-club\scripts\tail-vercel-logs.ps1`
- Start in: the repo path
- Or use `--once` with a trigger every 5 minutes if you prefer short-lived tasks:

  `…\tail-vercel-logs.ps1 --once`

### Keep it running on macOS / Linux

```bash
# launchd / systemd user unit, or a cron every minute:
* * * * * cd /path/to/scoopify-club && VERCEL_TOKEN=… ./scripts/tail-vercel-logs.sh --once >>logs/vercel-tail.log 2>&1
```

---

## 4. Optional: Sentry free tier (alerts only)

Not wired in by default — **no dependency is added**. If you want email/Slack-style alerts for crashes without paying for Vercel Pro:

1. Create a free project at [sentry.io](https://sentry.io).
2. Set `SENTRY_DSN` in Vercel (Production). Leave it unset to keep Sentry completely off.
3. A future small change can call Sentry only when `SENTRY_DSN` is present (e.g. from `onRequestError` after the SystemLog write). Prefer `@sentry/nextjs` only if you want their full Next integration; a tiny `fetch` to the Sentry envelope URL also works with zero deps.

Until that is added, treat SystemLog + local export + `tail-vercel-logs` as the source of truth.

---

## 5. Quick verification

```bash
npm run test:logs          # redaction + fail-open unit tests
npm run logs:export -- --dry-run
.\scripts\tail-vercel-logs.ps1 --once   # Windows
```

After this PR is deployed (needs the Next.js 15.5 upgrade from PR #7 on `main` first), provoke a 500 on a throwaway route or wait for a real error, then:

```bash
npm run logs:export -- --types SERVER_
# open the newest logs/systemlog/*.jsonl
```
