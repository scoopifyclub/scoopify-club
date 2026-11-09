// Local/test seed: catalog service plans plus one admin, customer and scooper.
// Run with `npx prisma db seed` against a local or disposable database only.
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { PLANS, getConfiguredPriceId } from '../src/lib/pricing-catalog.js';

const prisma = new PrismaClient();

const SEED_EMAILS = {
    admin: 'admin@scoopify.club',
    customer: 'demo@example.com',
    employee: 'employee@scoopify.club',
};

// The seed creates accounts with well-known passwords, so it refuses anything
// that looks like a shared database unless explicitly allowed.
function assertSafeTarget() {
    if (process.env.SEED_ALLOW_REMOTE === 'true') return;
    const url = process.env.DATABASE_URL || '';
    let host = '';
    try {
        host = new URL(url).hostname;
    }
    catch {
        // Unparseable URL: let Prisma report it.
    }
    const isLocal = ['localhost', '127.0.0.1', '::1', 'postgres', 'db'].includes(host);
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL || !isLocal) {
        throw new Error(`Refusing to seed ${host || 'this database'}: set SEED_ALLOW_REMOTE=true to seed a non-local database.`);
    }
}

const ids = () => ({ id: crypto.randomUUID(), updatedAt: new Date() });

async function upsertUser(email, data, password) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return existing;
    return prisma.user.create({
        data: { ...ids(), email, password: await bcrypt.hash(password, 12), emailVerified: true, ...data },
    });
}

async function seedServicePlans() {
    // Monthly plans have agreed amounts; one-time plans and the initial cleanup
    // are priced in Stripe (pending) and get their ServicePlan row from the
    // webhook on first purchase.
    for (const plan of PLANS.filter((p) => p.kind === 'subscription')) {
        const stripePriceId = getConfiguredPriceId(plan) || null;
        const data = {
            name: plan.name,
            description: plan.description,
            price: plan.displayAmount ?? 0,
            duration: 30,
            type: 'MONTHLY',
            stripePriceId,
            isActive: true,
            updatedAt: new Date(),
        };
        await prisma.servicePlan.upsert({
            where: { code: plan.id },
            update: data,
            create: { id: crypto.randomUUID(), code: plan.id, ...data },
        });
    }
}

async function main() {
    assertSafeTarget();

    await seedServicePlans();
    console.log('Service plans ready');

    await upsertUser(SEED_EMAILS.admin, { firstName: 'Admin', lastName: 'User', role: 'ADMIN' }, process.env.SEED_ADMIN_PASSWORD || 'Admin123!@#');

    const customerUser = await upsertUser(SEED_EMAILS.customer, { firstName: 'Demo', lastName: 'Customer', role: 'CUSTOMER' }, 'Demo123!@#');
    const customer = await prisma.customer.findUnique({ where: { userId: customerUser.id } })
        ?? await prisma.customer.create({
            data: {
                ...ids(),
                userId: customerUser.id,
                phone: '(555) 123-4567',
                serviceDay: 'monday',
                referralCode: 'DEMO-CUSTOMER',
                address: {
                    create: { ...ids(), street: '7525 Gallard Heights', city: 'Peyton', state: 'CO', zipCode: '80831' },
                },
            },
        });

    const employeeUser = await upsertUser(SEED_EMAILS.employee, { firstName: 'Demo', lastName: 'Scooper', role: 'EMPLOYEE' }, 'Employee123!@#');
    const employee = await prisma.employee.findUnique({ where: { userId: employeeUser.id } })
        ?? await prisma.employee.create({
            data: { ...ids(), userId: employeeUser.id, phone: '(555) 987-6543', status: 'ACTIVE', hasSetServiceArea: true },
        });
    // An active coverage area is what lets customer signup accept these ZIPs.
    for (const zipCode of ['80831', '80921']) {
        const area = await prisma.coverageArea.findFirst({ where: { employeeId: employee.id, zipCode } });
        if (!area) {
            await prisma.coverageArea.create({ data: { ...ids(), employeeId: employee.id, zipCode, active: true } });
        }
    }
    console.log('Users ready');

    console.log(`
Seeded (local test data only):
  Admin:    ${SEED_EMAILS.admin} (add to ADMIN_EMAILS to use admin routes)
  Customer: ${SEED_EMAILS.customer} / Demo123!@#  (customer ${customer.id}, no subscription)
  Scooper:  ${SEED_EMAILS.employee} / Employee123!@#  (covers 80831, 80921)
`);
}

main()
    .catch((error) => {
        console.error('Seed failed:', error.message);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
