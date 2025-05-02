import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import prisma from "@/lib/prisma";
import { cleanupDatabase, setupTestDatabase } from '@/tests/setup';
import { createTestUser } from '@/tests/setup';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/services/route';
import { requireAuth } from '@/lib/auth-server';
import { sendServiceNotificationEmail } from '@/lib/email';
// Mock the dependencies
jest.mock('@/lib/prisma', () => ({
    prisma: {
        customer: {
            findUnique: jest.fn(),
        },
        servicePlan: {
            findUnique: jest.fn(),
        },
        service: {
            create: jest.fn(),
            findMany: jest.fn(),
        },
    },
}));
jest.mock('@/lib/auth-server', () => ({
    requireAuth: jest.fn()
}));
jest.mock('@/lib/email', () => ({
    sendServiceNotificationEmail: jest.fn(),
}));
jest.mock('@/middleware/db', () => ({
    withDatabase: (handler) => handler,
}));
describe('Services API', () => {
    beforeAll(async () => {
        await setupTestDatabase();
    });

    afterAll(async () => {
        await cleanupDatabase();
    });

    describe('GET /api/services', () => {
        it('should return services for authenticated user', async () => {
            const user = await createTestUser();
            requireAuth.mockResolvedValue(user);

            const request = new NextRequest('http://localhost:3000/api/services');
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(Array.isArray(data)).toBe(true);
        });

        it('should return 401 for unauthenticated user', async () => {
            requireAuth.mockResolvedValue(null);

            const request = new NextRequest('http://localhost:3000/api/services');
            const response = await GET(request);

            expect(response.status).toBe(401);
        });
    });
});
