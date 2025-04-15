import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create demo admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@scoopify.com' },
    update: {},
    create: {
      email: 'admin@scoopify.com',
      name: 'Admin User',
      password: await hash('admin123', 12),
      role: 'ADMIN',
    },
  })

  // Create demo employee
  const employee = await prisma.employee.upsert({
    where: { email: 'employee@scoopify.com' },
    update: {},
    create: {
      name: 'Demo Employee',
      email: 'employee@scoopify.com',
      password: await hash('employee123', 12),
      phone: '555-123-4567',
    },
  })

  // Create demo customer
  const customer = await prisma.customer.upsert({
    where: { email: 'customer@scoopify.com' },
    update: {},
    create: {
      name: 'Demo Customer',
      email: 'customer@scoopify.com',
      password: await hash('customer123', 12),
      address: '123 Demo Street, Test City, TC 12345',
      phone: '555-987-6543',
    },
  })

  // Create demo subscription for customer
  const subscription = await prisma.subscription.upsert({
    where: { customerId: customer.id },
    update: {},
    create: {
      customerId: customer.id,
      plan: 'Single Dog',
      status: 'ACTIVE',
      startDate: new Date(),
    },
  })

  console.log({ admin, employee, customer, subscription })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 