#!/usr/bin/env node
/**
 * List scoopers and approve them so they can claim jobs.
 *
 *   node scripts/scooper-approvals.js list [--pending]
 *   node scripts/scooper-approvals.js approve <email> [--apply]
 *   node scripts/scooper-approvals.js active-jobs-check
 *
 * Reads DATABASE_URL from the environment. approve is a dry run unless
 * --apply is passed. In the app, admins use
 * POST/DELETE /api/admin/employees/<employeeId>/approval instead.
 * active-jobs-check lists scoopers holding more than one PENDING/IN_PROGRESS
 * job; the job-claiming migration's unique index fails while any exist.
 */
import { PrismaClient } from '@prisma/client';

const args = process.argv.slice(2);
const command = args[0];
const apply = args.includes('--apply');
const pendingOnly = args.includes('--pending');

function databaseLabel() {
  try {
    const url = new URL(process.env.DATABASE_URL);
    return `${url.hostname}${url.pathname}`;
  } catch {
    return '(DATABASE_URL not set or invalid)';
  }
}

async function main() {
  if (!['list', 'approve', 'active-jobs-check'].includes(command)) {
    console.error('Usage: node scripts/scooper-approvals.js <list [--pending]|approve <email> [--apply]|active-jobs-check>');
    process.exit(2);
  }

  console.log(`Database: ${databaseLabel()}`);
  if (command === 'approve') {
    console.log(apply ? 'Mode: APPLY (writes enabled)' : 'Mode: dry run (pass --apply to write)');
  }
  console.log('');

  const prisma = new PrismaClient();
  try {
    if (command === 'list') {
      const employees = await prisma.employee.findMany({
        where: pendingOnly ? { approvedAt: null } : undefined,
        select: {
          id: true,
          status: true,
          approvedAt: true,
          createdAt: true,
          user: { select: { email: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'asc' },
      });
      if (employees.length === 0) {
        console.log(pendingOnly ? 'No scoopers waiting for approval.' : 'No scoopers.');
        return;
      }
      console.table(
        employees.map((employee) => ({
          email: employee.user?.email,
          name: [employee.user?.firstName, employee.user?.lastName].filter(Boolean).join(' '),
          status: employee.status,
          approvedAt: employee.approvedAt?.toISOString() ?? '(pending)',
          createdAt: employee.createdAt?.toISOString(),
          id: employee.id,
        }))
      );
      return;
    }

    if (command === 'active-jobs-check') {
      const rows = await prisma.$queryRaw`
        SELECT "employeeId", COUNT(*)::int AS "activeJobs", array_agg("id") AS "serviceIds"
        FROM "Service"
        WHERE "employeeId" IS NOT NULL AND "status" IN ('PENDING', 'IN_PROGRESS')
        GROUP BY "employeeId" HAVING COUNT(*) > 1`;
      if (rows.length === 0) {
        console.log('OK: no scooper holds more than one active job.');
        return;
      }
      console.table(rows);
      console.log('\nResolve these (complete, cancel or unassign extra jobs) before deploying the job-claiming migration.');
      process.exitCode = 1;
      return;
    }

    const email = (args[1] || '').trim().toLowerCase();
    if (!email || email.startsWith('--')) {
      console.error('Usage: node scripts/scooper-approvals.js approve <email> [--apply]');
      process.exitCode = 2;
      return;
    }
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true, email: true, role: true, employee: { select: { id: true, status: true, approvedAt: true } } },
    });
    if (!user?.employee) {
      console.error(`No scooper (Employee) account for ${email}.`);
      process.exitCode = 1;
      return;
    }
    if (user.employee.approvedAt && user.employee.status === 'ACTIVE') {
      console.log(`${user.email} is already approved (${user.employee.approvedAt.toISOString()}).`);
      return;
    }
    console.log(`${user.email}: status ${user.employee.status} -> ACTIVE, approvedAt -> now`);
    if (!apply) {
      console.log('Dry run only. Re-run with --apply to approve.');
      return;
    }
    const now = new Date();
    await prisma.employee.update({
      where: { id: user.employee.id },
      data: { status: 'ACTIVE', approvedAt: now, approvedBy: 'scripts/scooper-approvals.js', updatedAt: now },
    });
    await prisma.systemLog.create({
      data: {
        type: 'SCOOPER_APPROVED',
        message: `Scooper ${user.employee.id} approved via scripts/scooper-approvals.js`,
        data: { employeeId: user.employee.id, at: now },
      },
    });
    console.log('Approved.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
