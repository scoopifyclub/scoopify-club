import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

export async function createTestUser(email: string, role: 'CUSTOMER' | 'EMPLOYEE') {
  try {
    // First verify the user doesn't exist
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      console.log(`User ${email} already exists, deleting...`)
      await cleanupTestData()
    }

    const hashedPassword = await hash('password123', 12)
    
    return await prisma.user.create({
      data: {
        email,
        name: `Test ${role}`,
        password: hashedPassword,
        role,
        ...(role === 'CUSTOMER' && {
          customer: {
            create: {
              name: `Test ${role}`,
              email: `customer_${email}`,
              phone: '1234567890',
              address: {
                create: {
                  street: '123 Test St',
                  city: 'Test City',
                  state: 'TS',
                  zipCode: '12345'
                }
              }
            }
          }
        }),
        ...(role === 'EMPLOYEE' && {
          employee: {
            create: {
              name: `Test ${role}`,
              email: `employee_${email}`,
              phone: '0987654321'
            }
          }
        })
      }
    })
  } catch (error) {
    console.error(`Error creating test user ${email}:`, error)
    throw error
  }
}

export async function cleanupTestData() {
  try {
    const testEmails = ['test@example.com', 'employee@example.com']
    
    // First verify if there's anything to clean up
    const existingUsers = await prisma.user.findMany({
      where: { email: { in: testEmails } },
      include: {
        customer: {
          include: {
            services: true,
            address: true
          }
        },
        employee: {
          include: {
            services: true
          }
        }
      }
    })

    if (existingUsers.length === 0) {
      console.log('No test users found to clean up')
      return
    }

    // Delete all services first
    await prisma.service.deleteMany({
      where: {
        OR: [
          { customer: { user: { email: { in: testEmails } } } },
          { employee: { user: { email: { in: testEmails } } } }
        ]
      }
    })

    // Delete addresses
    await prisma.address.deleteMany({
      where: {
        customer: { user: { email: { in: testEmails } } }
      }
    })

    // Delete customers
    await prisma.customer.deleteMany({
      where: { user: { email: { in: testEmails } } }
    })

    // Delete employees
    await prisma.employee.deleteMany({
      where: { user: { email: { in: testEmails } } }
    })

    // Finally delete users
    await prisma.user.deleteMany({
      where: { email: { in: testEmails } }
    })

    // Verify deletion
    const remainingUsers = await prisma.user.findMany({
      where: { email: { in: testEmails } }
    })

    if (remainingUsers.length > 0) {
      throw new Error('Failed to delete all test users')
    }

    console.log('Successfully cleaned up test data')
  } catch (error) {
    console.error('Error cleaning up test data:', error)
    throw error
  }
} 