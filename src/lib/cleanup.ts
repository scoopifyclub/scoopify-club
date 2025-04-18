import { prisma } from './prisma';

export async function cleanupExpiredTokens() {
  const now = new Date();

  // Delete expired or revoked refresh tokens
  await prisma.refreshToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: now } },
        { isRevoked: true },
      ],
    },
  });
}

// Function to schedule cleanup
export function scheduleTokenCleanup(intervalMinutes = 60) {
  setInterval(async () => {
    try {
      await cleanupExpiredTokens();
      console.log('Completed token cleanup at:', new Date().toISOString());
    } catch (error) {
      console.error('Error during token cleanup:', error);
    }
  }, intervalMinutes * 60 * 1000);
} 