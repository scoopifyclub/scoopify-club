import { FullConfig } from '@playwright/test';
import prisma from "@/lib/prisma";
import { testUsers } from './auth';

async function globalTeardown(config: FullConfig) {
  console.log('Tearing down test environment...');

  try {
    // Get test user emails
    const testUserEmails = Object.values(testUsers).map(u => u.email);
    console.log('Cleaning up test data for users:', testUserEmails);

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

    console.log('Test environment teardown complete');
  } catch (error) {
    console.error('Error during teardown:', error);
    throw error;
  }
}

export default globalTeardown; 