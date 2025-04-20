import { PrismaClient, Prisma } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

type UserRole = 'ADMIN' | 'CUSTOMER' | 'EMPLOYEE'

interface TestUser {
  email: string;
  role: UserRole;
  password: string;
}

async function main() {
  console.log('Starting database seed...')

  // Create test users
  const testUsers: TestUser[] = [
    {
      email: 'admin@scoopify.club',
      role: 'ADMIN',
      password: 'admin123',
    },
    {
      email: 'demo@example.com',
      role: 'CUSTOMER',
      password: 'demo123',
    },
    {
      email: 'john@example.com',
      role: 'CUSTOMER',
      password: 'john123',
    },
    {
      email: 'employee@scoopify.club',
      role: 'EMPLOYEE',
      password: 'employee123',
    },
  ]

  // Create service plan
  const servicePlan = await prisma.servicePlan.create({
    data: {
      name: 'Basic Plan',
      description: 'Basic cleaning service',
      price: 99.99,
      type: 'STANDARD',
      duration: 60, // 60 minutes
      isActive: true,
    },
  })

  // Create users and their profiles
  const createdUsers = await Promise.all(
    testUsers.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10)
      return prisma.user.create({
        data: {
          email: user.email,
          password: hashedPassword,
          role: user.role,
        },
      })
    })
  )

  // Create customer profiles for customer users
  const customerUsers = createdUsers.filter((user) => user.role === 'CUSTOMER')
  await Promise.all(
    customerUsers.map(async (user, index) => {
      const customer = await prisma.customer.create({
        data: {
          userId: user.id,
          phone: `555-000-${index + 1}`,
          stripeCustomerId: `cus_test_${index + 1}`,
          cashappName: `$customer${index + 1}`,
          address: {
            create: {
              street: `${index + 1} Main St`,
              city: 'Test City',
              state: 'TX',
              zipCode: '75001',
              country: 'USA',
            },
          },
          subscription: {
            create: {
              servicePlanId: servicePlan.id,
              status: 'ACTIVE',
              startDate: new Date(),
              endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            },
          },
        },
      })

      // Create some services for each customer
      await prisma.service.create({
        data: {
          customerId: customer.id,
          servicePlanId: servicePlan.id,
          status: 'COMPLETED',
          scheduledDate: new Date(),
        },
      })

      // Create some payments for each customer
      await prisma.payment.create({
        data: {
          customerId: customer.id,
          amount: 99.99,
          status: 'COMPLETED',
          type: 'SUBSCRIPTION',
        },
      })
    })
  )

  // Create employee profile for employee user
  const employeeUser = createdUsers.find((user) => user.role === 'EMPLOYEE')
  if (employeeUser) {
    await prisma.employee.create({
      data: {
        userId: employeeUser.id,
        phone: '555-000-0000',
        position: 'Cleaner',
        startDate: new Date(),
      },
    })
  }

  console.log('Database seeded successfully')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 