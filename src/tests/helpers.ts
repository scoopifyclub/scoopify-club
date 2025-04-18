import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'

interface CreateUserOptions {
  email: string
  password: string
  role: 'ADMIN' | 'CUSTOMER' | 'EMPLOYEE'
  name?: string
}

export async function createTestUser({ email, password, role, name }: CreateUserOptions) {
  const hashedPassword = await hash(password, 12)
  
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role,
      name: name || 'Test User',
    },
  })

  if (role === 'CUSTOMER') {
    await prisma.customer.create({
      data: {
        email,
        name: name || 'Test Customer',
        userId: user.id,
      },
    })
  } else if (role === 'EMPLOYEE') {
    await prisma.employee.create({
      data: {
        email,
        name: name || 'Test Employee',
        userId: user.id,
      },
    })
  }

  return user
}

export async function cleanupTestUser(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      customer: true,
      employee: true,
    },
  })

  if (!user) return

  if (user.customer) {
    await prisma.customer.delete({
      where: { id: user.customer.id },
    })
  }

  if (user.employee) {
    await prisma.employee.delete({
      where: { id: user.employee.id },
    })
  }

  await prisma.user.delete({
    where: { id: user.id },
  })
}

export async function createTestService(customerId: string) {
  // First create a service plan if it doesn't exist
  const servicePlan = await prisma.servicePlan.upsert({
    where: { id: 'test_plan' },
    create: {
      id: 'test_plan',
      name: 'Test Service Plan',
      price: 25.00,
      duration: 30,
      type: 'REGULAR',
      isActive: true
    },
    update: {}
  });

  return prisma.service.create({
    data: {
      customerId,
      servicePlanId: servicePlan.id,
      scheduledDate: new Date(),
      status: 'SCHEDULED',
      specialInstructions: 'Test service'
    },
  });
}

export async function cleanupTestService(serviceId: string) {
  await prisma.service.delete({
    where: { id: serviceId },
  })
} 