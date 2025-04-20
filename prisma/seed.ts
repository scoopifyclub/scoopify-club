import { PrismaClient, User } from './generated/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

interface TestUser {
  email: string;
  name: string;
  role: string;
  password: string;
}

async function main() {
  console.log('Starting database seed...')

  // Create test users
  const testUsers: TestUser[] = [
    {
      email: 'admin@scoopify.club',
      name: 'Admin User',
      role: 'ADMIN',
      password: 'admin123',
    },
    {
      email: 'demo@example.com',
      name: 'Demo User',
      role: 'CUSTOMER',
      password: 'demo123',
    },
    {
      email: 'john@example.com',
      name: 'John Doe',
      role: 'CUSTOMER',
      password: 'john123',
    },
    {
      email: 'employee@scoopify.club',
      name: 'Employee User',
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
    testUsers.map(async (user: TestUser) => {
      const hashedPassword = await bcrypt.hash(user.password, 10)
      return prisma.user.create({
        data: {
          email: user.email,
          name: user.name,
          password: hashedPassword,
          role: user.role,
          emailVerified: true,
        },
      })
    })
  )

  // Create customer profiles for customer users
  const customerUsers = createdUsers.filter((user: User) => user.role === 'CUSTOMER')
  await Promise.all(
    customerUsers.map(async (user: User, index: number) => {
      const customer = await prisma.customer.create({
        data: {
          userId: user.id,
          phone: `555-000-${index + 1}`,
          stripeCustomerId: `cus_test_${index + 1}`,
          cashAppName: `$customer${index + 1}`,
          referralCode: `REF${index + 1}`,
          address: {
            create: {
              street: `${index + 1} Main St`,
              city: 'Test City',
              state: 'TX',
              zipCode: '75001',
            },
          },
        },
      })

      // Create subscription for the customer
      const subscription = await prisma.subscription.create({
        data: {
          customerId: customer.id,
          planId: servicePlan.id,
          status: 'ACTIVE',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        },
      })

      // Update customer with subscription
      await prisma.customer.update({
        where: { id: customer.id },
        data: { subscriptionId: subscription.id },
      })

      // Create some services for each customer
      const service = await prisma.service.create({
        data: {
          customerId: customer.id,
          servicePlanId: servicePlan.id,
          status: 'COMPLETED',
          scheduledDate: new Date(),
          location: {
            create: {
              latitude: 32.7767,
              longitude: -96.7970,
              address: `${index + 1} Main St, Test City, TX 75001`,
            },
          },
          checklist: {
            create: {
              items: {
                "items": [
                  { "name": "Clean front yard", "completed": true },
                  { "name": "Clean back yard", "completed": true },
                  { "name": "Dispose of waste", "completed": true }
                ]
              },
              completedAt: new Date(),
              notes: "Great service!"
            }
          }
        },
      })

      // Create some payments for each customer
      await prisma.payment.create({
        data: {
          customerId: customer.id,
          amount: 99.99,
          status: 'COMPLETED',
          type: 'SUBSCRIPTION',
          subscriptionId: customer.subscriptionId,
        },
      })
    })
  )

  // Create employee profile for employee user
  const employeeUser = createdUsers.find((user: User) => user.role === 'EMPLOYEE')
  if (employeeUser) {
    const employee = await prisma.employee.create({
      data: {
        userId: employeeUser.id,
        phone: '555-000-0000',
        cashAppUsername: '$employee1',
        bio: 'Professional pet waste removal specialist',
        status: 'ACTIVE',
        rating: 4.8,
        completedJobs: 0,
        availability: {
          monday: { start: '09:00', end: '17:00' },
          tuesday: { start: '09:00', end: '17:00' },
          wednesday: { start: '09:00', end: '17:00' },
          thursday: { start: '09:00', end: '17:00' },
          friday: { start: '09:00', end: '17:00' },
        },
        serviceAreas: {
          create: {
            zipCode: '75001',
          },
        },
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