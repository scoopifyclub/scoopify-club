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

  // Create customer profile
  const customer = await prisma.customer.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      subscription: {
        create: {
          status: 'ACTIVE',
          startDate: new Date(),
          plan: {
            create: {
              name: 'Weekly Service',
              price: 29.99,
              duration: 60,
              description: 'Weekly yard cleaning service',
            },
          },
        },
      },
    },
  })

  console.log('Created customer profile')

  // Create some test services
  const services = await Promise.all([
    prisma.service.create({
      data: {
        customerId: customer.id,
        status: 'SCHEDULED',
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        servicePlan: {
          create: {
            name: 'Regular Cleanup',
            price: 29.99,
            duration: 60,
            description: 'Standard yard cleaning service',
          },
        },
      },
    }),
    prisma.service.create({
      data: {
        customerId: customer.id,
        status: 'COMPLETED',
        scheduledDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        servicePlan: {
          create: {
            name: 'Deep Clean',
            price: 49.99,
            duration: 90,
            description: 'Thorough yard cleaning service',
          },
        },
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
        type: 'SERVICE',
        serviceId: services[1].id,
      },
    }),
    prisma.payment.create({
      data: {
        customerId: customer.id,
        amount: 29.99,
        status: 'PENDING',
        type: 'SUBSCRIPTION',
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