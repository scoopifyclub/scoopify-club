import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Starting seed...')
    
    // Create test customer user
    const customerPassword = await hash('Customer123!', 12)
    console.log('Customer password hashed')

    const customerUser = await prisma.user.create({
      data: {
        email: 'customer@scoopify.com',
        name: 'Demo Customer',
        password: customerPassword,
        role: 'CUSTOMER',
      },
    })
    console.log('Customer user created:', customerUser)

    const customer = await prisma.customer.create({
      data: {
        userId: customerUser.id,
        name: 'Demo Customer',
        email: 'customer@scoopify.com',
        phone: '555-987-6543',
        status: 'ACTIVE',
      },
    })
    console.log('Customer created:', customer)

    // Create customer address
    const customerAddress = await prisma.address.create({
      data: {
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345',
        customerId: customer.id,
      },
    })
    console.log('Customer address created:', customerAddress)

    // Create test employee user
    const employeePassword = await hash('Employee123!', 12)
    console.log('Employee password hashed')

    const employeeUser = await prisma.user.create({
      data: {
        email: 'employee@scoopify.com',
        name: 'Demo Employee',
        password: employeePassword,
        role: 'EMPLOYEE',
      },
    })
    console.log('Employee user created:', employeeUser)

    const employee = await prisma.employee.create({
      data: {
        userId: employeeUser.id,
        name: 'Demo Employee',
        email: 'employee@scoopify.com',
        phone: '555-123-4567',
        status: 'ACTIVE',
      },
    })
    console.log('Employee created:', employee)

    // Create service area for employee
    const serviceArea = await prisma.serviceArea.create({
      data: {
        employeeId: employee.id,
        zipCode: '12345',
      },
    })
    console.log('Service area created:', serviceArea)

    console.log('Seed completed successfully')
  } catch (error) {
    console.error('Error during seed:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('Failed to seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    console.log('Disconnecting from database...')
    await prisma.$disconnect()
  }) 