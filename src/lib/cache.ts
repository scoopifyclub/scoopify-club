import prisma from '@/lib/prisma';

// Cache interface
interface CacheData {
  value: any;
  expiresAt: Date;
  tags?: string[];
}

// Cache operations
export async function getCache(key: string): Promise<any> {
  try {
    const cache = await prisma.cache.findUnique({
      where: { key }
    });

    if (!cache) return null;

    // Check if cache has expired
    if (cache.expiresAt < new Date()) {
      await prisma.cache.delete({
        where: { key }
      });
      return null;
    }

    return cache.value;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

export async function setCache(key: string, value: any, ttl: number = 3600, tags: string[] = []): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + ttl * 1000);

    await prisma.cache.upsert({
      where: { key },
      update: {
        value,
        expiresAt,
        tags
      },
      create: {
        key,
        value,
        expiresAt,
        tags
      }
    });
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

export async function invalidateCache(tags: string[]): Promise<void> {
  try {
    await prisma.cache.deleteMany({
      where: {
        tags: {
          hasSome: tags
        }
      }
    });
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
}

export async function clearCache(): Promise<void> {
  try {
    await prisma.cache.deleteMany({});
  } catch (error) {
    console.error('Cache clear error:', error);
  }
}

export function generateCacheKey(prefix: string, ...args: any[]): string {
  return `${prefix}:${args.join(':')}`;
} 