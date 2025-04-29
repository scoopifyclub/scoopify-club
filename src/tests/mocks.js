import { vi } from 'vitest';
// Mock NextAuth
export const mockNextAuth = {
    signIn: vi.fn().mockResolvedValue({ ok: true }),
    signOut: vi.fn().mockResolvedValue({ ok: true }),
    getSession: vi.fn().mockResolvedValue({
        user: {
            email: 'test@example.com',
            name: 'Test User',
            role: 'CUSTOMER',
        },
    }),
};
// Mock Prisma
export const mockPrisma = {
    user: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    customer: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    employee: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    service: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
};
// Mock Stripe
export const mockStripe = {
    customers: {
        create: vi.fn(),
        retrieve: vi.fn(),
        update: vi.fn(),
    },
    paymentIntents: {
        create: vi.fn(),
        retrieve: vi.fn(),
        update: vi.fn(),
    },
    subscriptions: {
        create: vi.fn(),
        retrieve: vi.fn(),
        update: vi.fn(),
    },
};
// Mock Email Service
export const mockEmail = {
    send: vi.fn().mockResolvedValue({ success: true }),
    sendPasswordReset: vi.fn().mockResolvedValue({ success: true }),
    sendVerification: vi.fn().mockResolvedValue({ success: true }),
};
// Mock Google Maps
export const mockGoogleMaps = {
    geocode: vi.fn().mockResolvedValue({
        results: [
            {
                geometry: {
                    location: {
                        lat: 37.7749,
                        lng: -122.4194,
                    },
                },
            },
        ],
    }),
    distanceMatrix: vi.fn().mockResolvedValue({
        rows: [
            {
                elements: [
                    {
                        distance: { text: '5.2 km', value: 5200 },
                        duration: { text: '10 mins', value: 600 },
                        status: 'OK',
                    },
                ],
            },
        ],
    }),
};
