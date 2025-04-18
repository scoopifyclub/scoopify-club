import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Starting seed...')
    
    // Create or update admin user
    const hashedAdminPassword = await hash('admin123', 12)
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@scoopify.com' },
      update: {
        password: hashedAdminPassword,
        role: 'ADMIN',
        emailVerified: true,
      },
      create: {
        email: 'admin@scoopify.com',
        name: 'Admin User',
        password: hashedAdminPassword,
        role: 'ADMIN',
        emailVerified: true,
      },
    })
    console.log('Admin user created/updated:', adminUser)

    // Create or update demo customer user
    const hashedCustomerPassword = await hash('demo123', 12)
    const demoCustomerUser = await prisma.user.upsert({
      where: { email: 'demo@example.com' },
      update: {
        password: hashedCustomerPassword,
        role: 'CUSTOMER',
        emailVerified: true,
      },
      create: {
        email: 'demo@example.com',
        name: 'Demo Customer',
        password: hashedCustomerPassword,
        role: 'CUSTOMER',
        emailVerified: true,
      },
    })
    console.log('Customer user created/updated:', demoCustomerUser)

    // Create or update demo customer
    const demoCustomer = await prisma.customer.upsert({
      where: { userId: demoCustomerUser.id },
      update: {},
      create: {
        userId: demoCustomerUser.id,
      },
    })
    console.log('Customer created/updated:', demoCustomer)

    // Create or update demo customer address
    await prisma.address.upsert({
      where: { customerId: demoCustomer.id },
      update: {
        street: '123 Demo St',
        city: 'Demo City',
        state: 'CA',
        zipCode: '90210',
      },
      create: {
        customerId: demoCustomer.id,
        street: '123 Demo St',
        city: 'Demo City',
        state: 'CA',
        zipCode: '90210',
      },
    })
    console.log('Customer address created/updated')

    // Create or update demo employee user
    const hashedEmployeePassword = await hash('demo123', 12)
    const demoEmployeeUser = await prisma.user.upsert({
      where: { email: 'employee@scoopify.com' },
      update: {
        password: hashedEmployeePassword,
        role: 'EMPLOYEE',
        emailVerified: true,
      },
      create: {
        email: 'employee@scoopify.com',
        name: 'Demo Employee',
        password: hashedEmployeePassword,
        role: 'EMPLOYEE',
        emailVerified: true,
      },
    })
    console.log('Employee user created/updated:', demoEmployeeUser)

    // Create or update demo employee
    const demoEmployee = await prisma.employee.upsert({
      where: { userId: demoEmployeeUser.id },
      update: {},
      create: {
        userId: demoEmployeeUser.id,
      },
    })
    console.log('Employee created/updated:', demoEmployee)

    // Create demo service area
    await prisma.serviceArea.create({
      data: {
        employeeId: demoEmployee.id,
        zipCode: '90210',
      },
    })
    console.log('Service area created')

    // Create demo service plan
    const demoServicePlan = await prisma.servicePlan.create({
      data: {
        name: 'Weekly Service',
        description: 'Weekly poop scooping service',
        price: 50.00,
        duration: 30,
        type: 'REGULAR',
      },
    })
    console.log('Service plan created:', demoServicePlan)

    // Create demo subscription
    await prisma.subscription.create({
      data: {
        customerId: demoCustomer.id,
        planId: demoServicePlan.id,
        status: 'ACTIVE',
        startDate: new Date(),
      },
    })
    console.log('Subscription created')

    console.log('Seed completed successfully!')
  } catch (error) {
    console.error('Error seeding database:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  }) 