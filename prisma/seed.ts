import { PrismaClient, User } from '@prisma/client'
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

  // Create or update users
  const createdUsers = await Promise.all(
    testUsers.map(async (user: TestUser) => {
      const hashedPassword = await bcrypt.hash(user.password, 10)
      return prisma.user.upsert({
        where: { email: user.email },
        update: {
          name: user.name,
          role: user.role,
          password: hashedPassword,
        },
        create: {
          email: user.email,
          name: user.name,
          role: user.role,
          password: hashedPassword,
          emailVerified: true,
        },
      })
    })
  )

  console.log('Created/Updated users:', createdUsers)

  // Create customer profiles for customer users
  const customerUsers = createdUsers.filter(user => user.role === 'CUSTOMER')
  
  for (const user of customerUsers) {
    await prisma.customer.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        stripeCustomerId: `fake_stripe_id_${user.id}`,
      },
    })
  }

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