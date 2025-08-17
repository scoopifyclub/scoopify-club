import { prisma } from '@/lib/prisma';
// Cache operations
export async function getCache(key) {
    try {
        const cache = await prisma.cache.findUnique({
            where: { key }
        });
        if (!cache)
            return null;
        // Check if cache has expired
        if (cache.expiresAt < new Date()) {
            await prisma.cache.delete({
                where: { key }
            });
            return null;
        }
        return cache.value;
    }
    catch (error) {
        console.error('Cache get error:', error);
        return null;
    }
}
export async function setCache(key, value, ttl = 3600, tags = []) {
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
                tags,
                id: `cache_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            }
        });
    }
    catch (error) {
        console.error('Cache set error:', error);
    }
}
export async function invalidateCache(tags) {
    try {
        await prisma.cache.deleteMany({
            where: {
                tags: {
                    hasSome: tags
                }
            }
        });
    }
    catch (error) {
        console.error('Cache invalidation error:', error);
    }
}
export async function clearCache() {
    try {
        await prisma.cache.deleteMany({});
    }
    catch (error) {
        console.error('Cache clear error:', error);
    }
}
export function generateCacheKey(prefix, ...args) {
    return `${prefix}:${args.join(':')}`;
}
