import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import prisma from "@/lib/prisma";
import { cleanupDatabase, setupTestDatabase } from '@/tests/setup';
import { createTestUser } from '@/tests/setup';
import { NextRequest } from 'next/server';
import { GET } from '../session/route';
import { verifyJWT } from '@/lib/auth-server';
import { edgeRateLimit } from '@/lib/edge-rate-limit';
// Mock the email sending function
jest.mock('@/lib/email', () => ({
    sendEmail: jest.fn().mockResolvedValue(true)
}));
// Mock auth functions
jest.mock('@/lib/auth-server', () => ({
    verifyJWT: jest.fn()
}));
jest.mock('@/lib/edge-rate-limit', () => ({
    edgeRateLimit: jest.fn()
}));
// Mock Request object
const mockRequest = (body) => ({
    json: () => Promise.resolve(body),
    headers: new Headers(),
    cookies: {
        get: () => undefined,
        getAll: () => [],
        set: () => { }
    }
});
describe('Authentication', () => {
    beforeAll(async () => {
        await setupTestDatabase();
    });
    afterAll(async () => {
        await cleanupDatabase();
    });
    beforeEach(async () => {
        await cleanupDatabase();
    });
    describe('Signup', () => {
        it('should create a new user successfully', async () => {
            const { POST } = await import('../signup/route');
            const response = await POST(mockRequest({
                email: 'test@example.com',
                name: 'Test User',
                password: 'Test123!@#',
                deviceFingerprint: 'test-device-fingerprint',
                role: 'CUSTOMER',
                address: {
                    street: '123 Test St',
                    city: 'Test City',
                    state: 'CA',
                    zipCode: '12345'
                }
            }));
            const data = await response.json();
            expect(response.status).toBe(201);
            expect(data.user).toBeDefined();
            expect(data.user.email).toBe('test@example.com');
            expect(data.user.role).toBe('CUSTOMER');
        });
        it('should reject duplicate email', async () => {
            const { POST } = await import('../signup/route');
            // First signup
            await POST(mockRequest({
                email: 'test@example.com',
                name: 'Test User',
                password: 'Test123!@#',
                deviceFingerprint: 'test-device-fingerprint',
                role: 'CUSTOMER',
                address: {
                    street: '123 Test St',
                    city: 'Test City',
                    state: 'CA',
                    zipCode: '12345'
                }
            }));
            // Second signup with same email
            const response = await POST(mockRequest({
                email: 'test@example.com',
                name: 'Test User 2',
                password: 'Test123!@#',
                deviceFingerprint: 'test-device-fingerprint-2',
                role: 'CUSTOMER',
                address: {
                    street: '456 Test St',
                    city: 'Test City',
                    state: 'CA',
                    zipCode: '12345'
                }
            }));
            const data = await response.json();
            expect(response.status).toBe(400);
            expect(data.error).toBe('User with this email already exists');
        });
        it('should reject weak password', async () => {
            const { POST } = await import('../signup/route');
            const response = await POST(mockRequest({
                email: 'test2@example.com',
                name: 'Test User',
                password: 'weak',
                deviceFingerprint: 'test-device-fingerprint',
                role: 'CUSTOMER',
                address: {
                    street: '123 Test St',
                    city: 'Test City',
                    state: 'CA',
                    zipCode: '12345'
                }
            }));
            const data = await response.json();
            expect(response.status).toBe(400);
            expect(data.error).toBe('Password does not meet requirements');
        });
    });
    describe('Signin', () => {
        it('should sign in user with valid credentials', async () => {
            // Create a test user first
            const { credentials } = await createTestUser('CUSTOMER');
            const { POST } = await import('../signin/route');
            const response = await POST(mockRequest({
                email: credentials.email,
                password: credentials.password,
                deviceFingerprint: credentials.deviceFingerprint
            }));
            const data = await response.json();
            expect(response.status).toBe(200);
            expect(data.accessToken).toBeDefined();
            expect(data.refreshToken).toBeDefined();
            expect(data.user).toBeDefined();
            expect(data.user.email).toBe(credentials.email);
        });
        it('should reject invalid credentials', async () => {
            const { credentials } = await createTestUser('CUSTOMER');
            const { POST } = await import('../signin/route');
            const response = await POST(mockRequest({
                email: credentials.email,
                password: 'wrongpassword',
                deviceFingerprint: credentials.deviceFingerprint
            }));
            const data = await response.json();
            expect(response.status).toBe(401);
            expect(data.error).toBe('Invalid credentials');
        });
    });
    describe('Email Verification', () => {
        it('should verify email with valid token', async () => {
            const { user } = await createTestUser('CUSTOMER');
            const verificationToken = 'valid-token';
            // Set verification token
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    verificationToken,
                    verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000)
                }
            });
            const { POST } = await import('../verify-email/route');
            const response = await POST(mockRequest({
                token: verificationToken
            }));
            const data = await response.json();
            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            // Check that email is verified
            const updatedUser = await prisma.user.findUnique({
                where: { id: user.id }
            });
            expect(updatedUser === null || updatedUser === void 0 ? void 0 : updatedUser.emailVerified).toBe(true);
        });
        it('should reject invalid verification token', async () => {
            const { POST } = await import('../verify-email/route');
            const response = await POST(mockRequest({
                token: 'invalid-token'
            }));
            const data = await response.json();
            expect(response.status).toBe(400);
            expect(data.error).toBe('Invalid or expired verification token');
        });
    });
    describe('Password Reset', () => {
        it('should reset password with valid token', async () => {
            const { user } = await createTestUser('CUSTOMER');
            const resetToken = 'valid-reset-token';
            // Set reset token
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    resetToken,
                    resetTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000)
                }
            });
            const { POST } = await import('../reset-password/route');
            const response = await POST(mockRequest({
                token: resetToken,
                newPassword: 'NewTest123!@#'
            }));
            const data = await response.json();
            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            // Try signing in with new password
            const { POST: signin } = await import('../signin/route');
            const signinResponse = await signin(mockRequest({
                email: user.email,
                password: 'NewTest123!@#',
                deviceFingerprint: user.deviceFingerprint
            }));
            const signinData = await signinResponse.json();
            expect(signinResponse.status).toBe(200);
            expect(signinData.accessToken).toBeDefined();
        });
        it('should reject invalid reset token', async () => {
            const { POST } = await import('../reset-password/route');
            const response = await POST(mockRequest({
                token: 'invalid-token',
                newPassword: 'NewTest123!@#'
            }));
            const data = await response.json();
            expect(response.status).toBe(400);
            expect(data.error).toBe('Invalid or expired reset token');
        });
    });
    describe('Session', () => {
        let mockRequest;
        beforeEach(() => {
            mockRequest = new NextRequest('http://localhost:3000/api/auth/session');
        });
        it('should return null for invalid token', async () => {
            verifyJWT.mockResolvedValue(null);
            const response = await GET(mockRequest);
            const data = await response.json();
            expect(response.status).toBe(200);
            expect(data).toEqual({ user: null });
        });
        it('should return user data for valid token', async () => {
            const user = await createTestUser();
            verifyJWT.mockResolvedValue({
                id: user.id,
                email: user.email,
                role: user.role
            });
            const response = await GET(mockRequest);
            const data = await response.json();
            expect(response.status).toBe(200);
            expect(data.user).toEqual({
                id: user.id,
                email: user.email,
                role: user.role
            });
        });
    });
});
