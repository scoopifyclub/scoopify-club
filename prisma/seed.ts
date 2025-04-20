import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seed...')

  // Create test user
  const hashedPassword = await bcrypt.hash('password123', 12)
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      name: 'Demo User',
      password: hashedPassword,
      role: 'CUSTOMER',
      emailVerified: true,
    },
  })

  console.log('Created test user:', user.email)

  // Create service plan
  const servicePlan = await prisma.servicePlan.create({
    data: {
      name: 'Weekly Service',
      description: 'Weekly yard cleaning service',
      price: 29.99,
      duration: 60,
      type: 'REGULAR',
      isActive: true,
    },
  })

  console.log('Created service plan:', servicePlan.name)

  // Create customer profile with address
  const customer = await prisma.customer.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      address: {
        create: {
          street: '123 Demo St',
          city: 'Demo City',
          state: 'CA',
          zipCode: '12345',
        },
      },
    },
  })

  console.log('Created customer profile')

  // Create subscription
  const subscription = await prisma.subscription.create({
    data: {
      customerId: customer.id,
      planId: servicePlan.id,
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  })

  console.log('Created subscription')

  // Create some test services
  const services = await Promise.all([
    prisma.service.create({
      data: {
        customerId: customer.id,
        status: 'SCHEDULED',
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        servicePlanId: servicePlan.id,
      },
    }),
    prisma.service.create({
      data: {
        customerId: customer.id,
        status: 'COMPLETED',
        scheduledDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        servicePlanId: servicePlan.id,
      },
    }),
  ])

  console.log('Created test services')

  // Create some test payments
  const payments = await Promise.all([
    prisma.payment.create({
      data: {
        customerId: customer.id,
        amount: 29.99,
        status: 'COMPLETED',
        type: 'COMPANY',
        serviceId: services[1].id,
      },
    }),
    prisma.payment.create({
      data: {
        customerId: customer.id,
        amount: 29.99,
        status: 'PENDING',
        type: 'SUBSCRIPTION',
        subscriptionId: subscription.id,
      },
    }),
  ])

  console.log('Created test payments')
  console.log('Database seeding completed!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 