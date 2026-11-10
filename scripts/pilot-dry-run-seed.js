#!/usr/bin/env node
/**
 * Seed a SAFE dry-run customer + unclaimed job for the SCO-6 pilot path.
 *
 * Does NOT call Stripe. Does NOT create subscriptions. Does NOT email anyone.
 * Dry run unless --apply is passed. Prints the database host first — confirm
 * it before applying against production.
 *
 *   node scripts/pilot-dry-run-seed.js
 *   node scripts/pilot-dry-run-seed.js --apply
 *   node scripts/pilot-dry-run-seed.js --apply --zip=80831 --email=dryrun+customer@example.com
 *
 * Beta scoopers should self-register at /auth/scooper-signup (no Stripe), then
 * be approved with:
 *   node scripts/scooper-approvals.js approve <email> --apply
 *
 * Keep PAYOUTS_ENABLED unset/false for the entire dry run.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const argValue = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

const EMAIL = argValue('email', 'dryrun+customer@example.com').trim().toLowerCase();
const PASSWORD = argValue('password', 'DryRun123!@#');
const ZIP = argValue('zip', '80831');
const STREET = argValue('street', '7525 Gallard Heights');
const CITY = argValue('city', 'Peyton');
const STATE = argValue('state', 'CO');
const PLAN_CODE = argValue('plan', 'single-dog-monthly');

function databaseLabel() {
  try {
    const url = new URL(process.env.DATABASE_URL);
    return `${url.hostname}${url.pathname}`;
  } catch {
    return '(DATABASE_URL not set or invalid)';
  }
}

const ids = () => ({ id: crypto.randomUUID(), updatedAt: new Date() });

async function main() {
  console.log(`Database: ${databaseLabel()}`);
  console.log(apply ? 'Mode: APPLY (writes enabled)' : 'Mode: dry run (pass --apply to write)');
  console.log(`Customer email: ${EMAIL}`);
  console.log(`Address ZIP: ${ZIP} (must match an approved scooper CoverageArea)`);
  console.log(`Plan code: ${PLAN_CODE}`);
  console.log('');

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required.');
    process.exitCode = 2;
    return;
  }

  const prisma = new PrismaClient();
  try {
    const plan =
      (await prisma.servicePlan.findFirst({ where: { code: PLAN_CODE, isActive: true } })) ||
      (await prisma.servicePlan.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'asc' } }));

    if (!plan) {
      console.error('No ServicePlan found. Seed catalog plans first (npx prisma db seed on a safe DB), or create one in admin.');
      process.exitCode = 1;
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: EMAIL },
      include: { customer: { include: { address: true } } },
    });

    const openPoolJobs = existingUser?.customer
      ? await prisma.service.count({
          where: {
            customerId: existingUser.customer.id,
            status: 'SCHEDULED',
            employeeId: null,
          },
        })
      : 0;

    console.log('Would ensure:');
    console.log(`  - CUSTOMER user ${EMAIL} (password only printed on apply for new users)`);
    console.log(`  - Address ${STREET}, ${CITY}, ${STATE} ${ZIP}`);
    console.log(`  - One SCHEDULED unclaimed Service on plan ${plan.code || plan.id} ($${plan.price})`);
    console.log(`  - Existing open pool jobs for this customer: ${openPoolJobs}`);
    console.log('Will NOT: create Stripe customers/subscriptions, charge cards, enable payouts, or email anyone.');
    console.log('');

    if (!apply) {
      console.log('Dry run only. Re-run with --apply to write.');
      return;
    }

    const now = new Date();
    let user = existingUser;
    if (!user) {
      user = await prisma.user.create({
        data: {
          ...ids(),
          email: EMAIL,
          firstName: 'Dry',
          lastName: 'Run',
          password: await bcrypt.hash(PASSWORD, 12),
          role: 'CUSTOMER',
          emailVerified: true,
        },
        include: { customer: { include: { address: true } } },
      });
      console.log(`Created user ${user.email} / ${PASSWORD}`);
    } else {
      console.log(`Using existing user ${user.email}`);
    }

    let customer = user.customer;
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          ...ids(),
          userId: user.id,
          phone: '(555) 010-0000',
          serviceDay: 'monday',
          referralCode: `DRY-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
          serviceCredits: 1,
          address: {
            create: {
              ...ids(),
              street: STREET,
              city: CITY,
              state: STATE,
              zipCode: ZIP,
            },
          },
        },
        include: { address: true },
      });
      console.log(`Created customer ${customer.id}`);
    } else if (!customer.address) {
      await prisma.address.create({
        data: {
          ...ids(),
          customerId: customer.id,
          street: STREET,
          city: CITY,
          state: STATE,
          zipCode: ZIP,
        },
      });
      customer = await prisma.customer.findUnique({
        where: { id: customer.id },
        include: { address: true },
      });
      console.log(`Created address for customer ${customer.id}`);
    } else if (customer.address.zipCode !== ZIP) {
      await prisma.address.update({
        where: { id: customer.address.id },
        data: { street: STREET, city: CITY, state: STATE, zipCode: ZIP, updatedAt: now },
      });
      console.log(`Updated address ZIP to ${ZIP}`);
    }

    // Weekly club visit allocation shown to scoopers: monthly × 12/52 × 75%.
    const potentialEarnings =
      plan.type === 'MONTHLY' || plan.type === 'WEEKLY'
        ? Math.round(((plan.price * 12) / 52) * 0.75 * 100) / 100
        : Math.round(plan.price * 0.75 * 100) / 100;

    const service = await prisma.service.create({
      data: {
        id: crypto.randomUUID(),
        customerId: customer.id,
        servicePlanId: plan.id,
        scheduledDate: new Date(Date.now() + 60 * 60 * 1000),
        status: 'SCHEDULED',
        workflowStatus: 'AVAILABLE',
        employeeId: null,
        potentialEarnings,
        notes: 'SCO-6 dry-run job (no live Stripe). Do not pay out.',
        updatedAt: now,
      },
    });

    console.log('');
    console.log('Dry-run seed applied:');
    console.log(`  Customer: ${EMAIL} (customerId ${customer.id})`);
    console.log(`  Job:      ${service.id} status=${service.status} workflow=${service.workflowStatus}`);
    console.log(`  Plan:     ${plan.name} (${plan.code || plan.id}) potentialEarnings=$${potentialEarnings}`);
    console.log('');
    console.log('Next:');
    console.log('  1. Beta scoopers: /auth/scooper-signup covering ZIP', ZIP);
    console.log('  2. Approve: node scripts/scooper-approvals.js approve <email> --apply');
    console.log('  3. Scooper claims the job during 8am–7pm America/Denver (available-services feed)');
    console.log('  4. Keep PAYOUTS_ENABLED unset/false');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
