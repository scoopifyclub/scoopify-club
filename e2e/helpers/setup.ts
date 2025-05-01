import { FullConfig } from '@playwright/test';
import { prisma } from "../lib/prisma";
import { testUsers } from './auth';
import { hash } from 'bcryptjs';

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
            email: userData.email,
            password: hashedPassword,
            name: userData.name,
            role: userData.role,
            emailVerified: true,
          },
        });

        // Create role-specific data
        if (role === 'customer') {
          await prisma.customer.create({
            data: {
              userId: user.id,
              address: {
                create: {
                  street: '123 Test St',
                  city: 'Test City',
                  state: 'CA',
                  zipCode: '12345',
                },
              },
            },
          });
        } else if (role === 'employee') {
          await prisma.employee.create({
            data: {
              userId: user.id,
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
        customer: {
          user: {
            email: {
              in: testUserEmails
            }
          }
        }
      }
    });

    // Delete test payments
    await prisma.payment.deleteMany({
      where: {
        OR: [
          {
            customer: {
              user: {
                email: {
                  in: testUserEmails
                }
              }
            }
          },
          {
            employee: {
              user: {
                email: {
                  in: testUserEmails
                }
              }
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