#!/usr/bin/env node
// Calls one /api/cron/* route the way Vercel Cron does.
//   APP_URL=https://www.scoopify.club CRON_SECRET=... npm run cron:run -- create-weekly-services
// APP_URL defaults to http://localhost:3000.

const job = process.argv[2];
const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
const secret = process.env.CRON_SECRET;

if (!job || !/^[a-z0-9-]+(\?[\w=&-]*)?$/.test(job)) {
  console.error('Usage: npm run cron:run -- <cron-route-name>   e.g. create-weekly-services');
  process.exit(2);
}
if (!secret) {
  console.error('Set CRON_SECRET (the same value as in the target environment).');
  process.exit(2);
}

const response = await fetch(`${appUrl}/api/cron/${job}`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${secret}` },
});
const body = await response.text();
console.log(`${response.status} ${response.statusText}`);
console.log(body);
process.exit(response.ok ? 0 : 1);
