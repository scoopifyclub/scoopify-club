import { FullConfig } from '@playwright/test';
import { prisma } from "../lib/prisma";
import { testUsers } from './auth';
import { hash } from 'bcryptjs';
import crypto from 'crypto';

async function globalSetup(config: FullConfig) {
  console.log('Setting up test environment...');

  // Set test environment variables
  // Note: NODE_ENV is read-only during build
  process.env.JWT_SECRET = 'test-secret';
  process.env.STRIPE_SECRET_KEY = 'test-stripe-key';

  try {
    console.log('\n=== Setting up Test Users ===');
    
    // Get test user emails
    const testUserEmails = Object.values(testUsers).map(u => u.email);
    console.log('Checking for test users:', testUserEmails);

    // Find existing test users
    const existingUsers = await prisma.user.findMany({
      where: {
        email: {
          in: testUserEmails
        }
      },
      select: {
        id: true,
        email: true,
        role: true
      }
    });

    console.log('Found existing users:', existingUsers.map(u => u.email));

    // Create missing test users
    for (const [role, userData] of Object.entries(testUsers)) {
      const existingUser = existingUsers.find(u => u.email === userData.email);
      if (!existingUser) {
        console.log(`Creating ${role} user...`);
        const hashedPassword = await hash(userData.password, 10);
        
        // Create user
        const user = await prisma.user.create({
          data: {
            id: crypto.randomUUID(),
            email: userData.email,
            password: hashedPassword,
            name: userData.name,
            role: userData.role,
            emailVerified: true,
            updatedAt: new Date(),
          },
        });

        // Create role-specific data
        if (role === 'customer') {
          const customer = await prisma.customer.create({
            data: {
              id: crypto.randomUUID(),
              userId: user.id,
              updatedAt: new Date(),
            },
          });

          // Create address separately
          await prisma.address.create({
            data: {
              id: crypto.randomUUID(),
              street: '123 Test St',
              city: 'Test City',
              state: 'CA',
              zipCode: '12345',
              customerId: customer.id,
              updatedAt: new Date(),
            },
          });
        } else if (role === 'employee') {
          await prisma.employee.create({
            data: {
              id: crypto.randomUUID(),
              userId: user.id,
              status: 'ACTIVE',
              updatedAt: new Date(),
            },
          });
        }

        console.log(`Created ${role} user with ID: ${user.id}`);
      }
    }

    // Clean up any test data
    console.log('\n=== Cleaning up Test Data ===');
    
    // Delete test services
    await prisma.service.deleteMany({
      where: {
        customerId: {
          in: existingUsers.map(u => u.id)
        }
      }
    });

    // Delete test payments
    await prisma.payment.deleteMany({
      where: {
        OR: [
          {
            customerId: {
              in: existingUsers.map(u => u.id)
            }
          },
          {
            employeeId: {
              in: existingUsers.map(u => u.id)
            }
          }
        ]
      }
    });

    console.log('Test environment setup complete');
  } catch (error) {
    console.error('Error setting up test environment:', error);
    throw error;
  }
}

export default globalSetup; 