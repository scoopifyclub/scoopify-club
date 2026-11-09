#!/usr/bin/env node
/**
 * List and clean up ADMIN accounts against the ADMIN_EMAILS allowlist.
 *
 *   node scripts/admin-accounts.js list
 *   node scripts/admin-accounts.js demote-unverified [--role=SUSPENDED] [--apply]
 *   node scripts/admin-accounts.js promote <email> [--apply]
 *
 * Reads DATABASE_URL and ADMIN_EMAILS from the environment. Every command
 * that writes is a dry run unless --apply is passed. See docs/admin-access.md.
 */
import { PrismaClient } from '@prisma/client';

const args = process.argv.slice(2);
const command = args[0];
const apply = args.includes('--apply');
const roleArg = args.find((arg) => arg.startsWith('--role='));
const demoteToRole = roleArg ? roleArg.slice('--role='.length) : 'SUSPENDED';

const allowlist = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

function databaseLabel() {
  try {
    const url = new URL(process.env.DATABASE_URL);
    return `${url.hostname}${url.pathname}`;
  } catch {
    return '(DATABASE_URL not set or invalid)';
  }
}

function isAllowlisted(email) {
  return allowlist.includes((email || '').trim().toLowerCase());
}

async function listAdmins(prisma) {
  return prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true, email: true, emailVerified: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
}

function printAdmins(admins) {
  if (admins.length === 0) {
    console.log('No users with role ADMIN.');
    return;
  }
  console.table(
    admins.map((admin) => ({
      email: admin.email,
      allowlisted: isAllowlisted(admin.email),
      emailVerified: admin.emailVerified,
      createdAt: admin.createdAt?.toISOString?.() ?? admin.createdAt,
      id: admin.id,
    }))
  );
}

async function main() {
  if (!['list', 'demote-unverified', 'promote'].includes(command)) {
    console.error('Usage: node scripts/admin-accounts.js <list|demote-unverified|promote <email>> [--apply]');
    process.exit(2);
  }

  console.log(`Database: ${databaseLabel()}`);
  console.log(`ADMIN_EMAILS: ${allowlist.length ? allowlist.join(', ') : '(empty)'}`);
  if (command !== 'list') {
    console.log(apply ? 'Mode: APPLY (writes enabled)' : 'Mode: dry run (pass --apply to write)');
  }
  console.log('');

  const prisma = new PrismaClient();
  try {
    if (command === 'list') {
      printAdmins(await listAdmins(prisma));
      return;
    }

    if (command === 'demote-unverified') {
      if (allowlist.length === 0) {
        console.error('Refusing to demote: ADMIN_EMAILS is empty, so every admin would be demoted.');
        process.exitCode = 1;
        return;
      }
      if (demoteToRole === 'ADMIN') {
        console.error('--role must not be ADMIN.');
        process.exitCode = 1;
        return;
      }
      const admins = await listAdmins(prisma);
      printAdmins(admins);
      const toDemote = admins.filter((admin) => !isAllowlisted(admin.email));
      if (toDemote.length === 0) {
        console.log('\nEvery ADMIN account is allowlisted. Nothing to demote.');
        return;
      }
      console.log(`\n${toDemote.length} ADMIN account(s) not in ADMIN_EMAILS will be set to role ${demoteToRole}:`);
      toDemote.forEach((admin) => console.log(`  - ${admin.email} (${admin.id})`));
      if (!apply) {
        console.log('\nDry run only. Re-run with --apply to demote.');
        return;
      }
      const result = await prisma.user.updateMany({
        where: { id: { in: toDemote.map((admin) => admin.id) }, role: 'ADMIN' },
        data: { role: demoteToRole, updatedAt: new Date() },
      });
      console.log(`\nDemoted ${result.count} account(s). Their admin sessions are now invalid.`);
      return;
    }

    if (command === 'promote') {
      const email = (args[1] || '').trim().toLowerCase();
      if (!email || email.startsWith('--')) {
        console.error('Usage: node scripts/admin-accounts.js promote <email> [--apply]');
        process.exitCode = 2;
        return;
      }
      if (!isAllowlisted(email)) {
        console.error(`Refusing to promote ${email}: add it to ADMIN_EMAILS first.`);
        process.exitCode = 1;
        return;
      }
      const user = await prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
        select: { id: true, email: true, role: true },
      });
      if (!user) {
        console.error(`No user with email ${email}. Sign up normally first, then promote.`);
        process.exitCode = 1;
        return;
      }
      if (user.role === 'ADMIN') {
        console.log(`${user.email} is already ADMIN.`);
        return;
      }
      console.log(`${user.email}: ${user.role} -> ADMIN`);
      if (!apply) {
        console.log('Dry run only. Re-run with --apply to promote.');
        return;
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'ADMIN', updatedAt: new Date() },
      });
      console.log('Promoted.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
