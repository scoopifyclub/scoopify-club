import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import prisma from "../lib/prisma";
import { login, verifyToken, refreshToken, logout } from '../lib/auth';
import { cleanupDatabase, setupTestDatabase } from './setup';
import { testUsers, createTestUser, createTestRequest, createTestResponse } from './setup';
import { signup } from '../app/api/auth/signup/route';
import { verifyEmail } from '../app/api/auth/verify-email/route';
import { forgotPassword } from '../app/api/auth/forgot-password/route';
import { resetPassword } from '../app/api/auth/reset-password/route';
describe('Authentication System', () => {
    beforeAll(async () => {
        await setupTestDatabase();
    });
    afterAll(async () => {
        await cleanupDatabase();
    });
    beforeEach(async () => {
        await cleanupDatabase();
    });
    describe('User Management', () => {
        it('should create a test user', async () => {
            const user = await prisma.user.create({
                data: {
                    email: 'test@example.com',
                    password: 'hashedpassword',
                    role: 'CUSTOMER',
                    deviceFingerprint: 'test-device',
                },
            });
            expect(user).toBeDefined();
            expect(user.email).toBe('test@example.com');
        });
    });
    describe('Authentication', () => {
        it('should login with valid credentials', async () => {
            const result = await login('test@example.com', 'password123', 'test-device');
            expect(result.success).toBe(true);
            expect(result.data).toHaveProperty('accessToken');
            expect(result.data).toHaveProperty('refreshToken');
        });
        it('should verify access token', async () => {
            const loginResult = await login('test@example.com', 'password123', 'test-device');
            const verification = await verifyToken(loginResult.data.accessToken);
            expect(verification.success).toBe(true);
            expect(verification.data).toHaveProperty('userId');
        });
        it('should refresh token', async () => {
            const loginResult = await login('test@example.com', 'password123', 'test-device');
            const refreshResult = await refreshToken(loginResult.data.refreshToken);
            expect(refreshResult.success).toBe(true);
            expect(refreshResult.data).toHaveProperty('accessToken');
        });
        it('should logout', async () => {
            const loginResult = await login('test@example.com', 'password123', 'test-device');
            const logoutResult = await logout(loginResult.data.refreshToken);
            expect(logoutResult.success).toBe(true);
        });
    });
    describe('Error Handling', () => {
        it('should handle invalid credentials', async () => {
            const result = await login('test@example.com', 'wrongpassword', 'test-device');
            expect(result.success).toBe(false);
            expect(result.error).toBe('Invalid credentials');
        });
        it('should handle rate limiting', async () => {
            // Try to login multiple times with wrong password
            for (let i = 0; i < 6; i++) {
                await login('test@example.com', 'wrongpassword', 'test-device');
            }
            const result = await login('test@example.com', 'password123', 'test-device');
            expect(result.success).toBe(false);
            expect(result.error).toBe('Rate limit exceeded');
        });
    });
    describe('Login Flow', () => {
        it('should login successfully with correct credentials', async () => {
            const user = await createTestUser(testUsers.customer);
            const request = createTestRequest('POST', {
                email: testUsers.customer.email,
                password: testUsers.customer.password,
            });
            const response = createTestResponse();
            await login(request, response);
            expect(response.status).toHaveBeenCalledWith(200);
            expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
                accessToken: expect.any(String),
                refreshToken: expect.any(String),
                user: expect.objectContaining({
                    id: user.id,
                    email: user.email,
                    role: user.role,
                }),
            }));
        });
        it('should fail login with incorrect password', async () => {
            await createTestUser(testUsers.customer);
            const request = createTestRequest('POST', {
                email: testUsers.customer.email,
                password: 'wrongpassword',
            });
            const response = createTestResponse();
            await login(request, response);
            expect(response.status).toHaveBeenCalledWith(401);
            expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
                error: 'Invalid email or password',
            }));
        });
        it('should fail login with non-existent email', async () => {
            const request = createTestRequest('POST', {
                email: 'nonexistent@test.com',
                password: 'anypassword',
            });
            const response = createTestResponse();
            await login(request, response);
            expect(response.status).toHaveBeenCalledWith(401);
            expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
                error: 'Invalid email or password',
            }));
        });
    });
    describe('Signup Flow', () => {
        it('should create new user successfully', async () => {
            const request = createTestRequest('POST', {
                email: 'newuser@test.com',
                password: 'NewUser123!',
                name: 'New User',
                role: 'CUSTOMER',
            });
            const response = createTestResponse();
            await signup(request, response);
            expect(response.status).toHaveBeenCalledWith(201);
            expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
                user: expect.objectContaining({
                    email: 'newuser@test.com',
                    name: 'New User',
                    role: 'CUSTOMER',
                }),
            }));
            // Verify user was created in database
            const createdUser = await prisma.user.findUnique({
                where: { email: 'newuser@test.com' },
            });
            expect(createdUser).toBeTruthy();
        });
        it('should fail signup with existing email', async () => {
            await createTestUser(testUsers.customer);
            const request = createTestRequest('POST', {
                email: testUsers.customer.email,
                password: 'NewUser123!',
                name: 'New User',
                role: 'CUSTOMER',
            });
            const response = createTestResponse();
            await signup(request, response);
            expect(response.status).toHaveBeenCalledWith(409);
            expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
                error: 'Email already exists',
            }));
        });
        it('should validate password strength', async () => {
            const request = createTestRequest('POST', {
                email: 'newuser@test.com',
                password: 'weak',
                name: 'New User',
                role: 'CUSTOMER',
            });
            const response = createTestResponse();
            await signup(request, response);
            expect(response.status).toHaveBeenCalledWith(400);
            expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
                error: expect.stringContaining('Password'),
            }));
        });
    });
    describe('Token Verification', () => {
        it('should verify valid token', async () => {
            const user = await createTestUser(testUsers.customer);
            const token = await verifyToken('valid-token');
            expect(token).toBeTruthy();
            expect(token === null || token === void 0 ? void 0 : token.id).toBe(user.id);
        });
        it('should reject invalid token', async () => {
            const token = await verifyToken('invalid-token');
            expect(token).toBeNull();
        });
        it('should reject expired token', async () => {
            const token = await verifyToken('expired-token');
            expect(token).toBeNull();
        });
    });
    describe('Email Verification', () => {
        it('should verify email with valid token', async () => {
            var _a;
            // First, get the verification token for the test user
            const user = await prisma.user.findUnique({
                where: { email: 'test@test.com' },
                include: { emailVerification: true },
            });
            if (!((_a = user === null || user === void 0 ? void 0 : user.emailVerification) === null || _a === void 0 ? void 0 : _a.token)) {
                throw new Error('No verification token found');
            }
            const response = await verifyEmail(new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify({ token: user.emailVerification.token }),
            }));
            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
        });
        it('should reject invalid verification token', async () => {
            const response = await verifyEmail(new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify({ token: 'invalid-token' }),
            }));
            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toBe('Invalid verification token');
        });
    });
    describe('Password Reset Flow', () => {
        it('should send reset email for valid email', async () => {
            const response = await forgotPassword(new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify({ email: 'test@test.com' }),
            }));
            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
        });
        it('should reset password with valid token', async () => {
            var _a;
            // First, get the reset token for the test user
            const user = await prisma.user.findUnique({
                where: { email: 'test@test.com' },
                include: { passwordResetToken: true },
            });
            if (!((_a = user === null || user === void 0 ? void 0 : user.passwordResetToken) === null || _a === void 0 ? void 0 : _a.token)) {
                throw new Error('No reset token found');
            }
            const newPassword = 'NewTest123!@#';
            const response = await resetPassword(new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify({
                    token: user.passwordResetToken.token,
                    newPassword,
                }),
            }));
            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
            // Verify new password works
            const loginResponse = await signin(new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify({
                    email: 'test@test.com',
                    password: newPassword,
                }),
            }));
            expect(loginResponse.status).toBe(200);
        });
    });
    describe('Login', () => {
        it('should successfully login a customer', async () => {
            const { credentials } = await createTestUser('CUSTOMER');
            const response = await login(credentials.email, credentials.password, credentials.deviceFingerprint);
            expect(response).toHaveProperty('accessToken');
            expect(response).toHaveProperty('refreshToken');
            expect(response).toHaveProperty('user');
            expect(response.user.role).toBe('CUSTOMER');
        });
        it('should successfully login an employee', async () => {
            const { credentials } = await createTestUser('EMPLOYEE');
            const response = await login(credentials.email, credentials.password, credentials.deviceFingerprint);
            expect(response).toHaveProperty('accessToken');
            expect(response).toHaveProperty('refreshToken');
            expect(response).toHaveProperty('user');
            expect(response.user.role).toBe('EMPLOYEE');
        });
        it('should successfully login an admin', async () => {
            const { credentials } = await createTestUser('ADMIN');
            const response = await login(credentials.email, credentials.password, credentials.deviceFingerprint);
            expect(response).toHaveProperty('accessToken');
            expect(response).toHaveProperty('refreshToken');
            expect(response).toHaveProperty('user');
            expect(response.user.role).toBe('ADMIN');
        });
        it('should fail login with invalid credentials', async () => {
            const { credentials } = await createTestUser('CUSTOMER');
            await expect(login(credentials.email, 'wrongpassword', credentials.deviceFingerprint))
                .rejects
                .toThrow('Invalid credentials');
        });
        it('should fail login with invalid device fingerprint', async () => {
            const { credentials } = await createTestUser('CUSTOMER');
            await expect(login(credentials.email, credentials.password, 'wrong-fingerprint'))
                .rejects
                .toThrow('Invalid device fingerprint');
        });
    });
    describe('Token Verification', () => {
        it('should verify a valid access token', async () => {
            const { credentials } = await createTestUser('CUSTOMER');
            const { accessToken } = await login(credentials.email, credentials.password, credentials.deviceFingerprint);
            const decoded = await verifyToken(accessToken);
            expect(decoded).toHaveProperty('id');
            expect(decoded).toHaveProperty('role', 'CUSTOMER');
        });
        it('should fail to verify an invalid token', async () => {
            await expect(verifyToken('invalid-token'))
                .rejects
                .toThrow('Invalid token');
        });
    });
    describe('Token Refresh', () => {
        it('should refresh an access token with a valid refresh token', async () => {
            const { credentials } = await createTestUser('CUSTOMER');
            const { refreshToken: oldRefreshToken } = await login(credentials.email, credentials.password, credentials.deviceFingerprint);
            const response = await refreshToken(oldRefreshToken, credentials.deviceFingerprint);
            expect(response).toHaveProperty('accessToken');
            expect(response).toHaveProperty('refreshToken');
            expect(response.refreshToken).not.toBe(oldRefreshToken);
        });
        it('should fail to refresh with an invalid refresh token', async () => {
            const { credentials } = await createTestUser('CUSTOMER');
            await expect(refreshToken('invalid-token', credentials.deviceFingerprint))
                .rejects
                .toThrow('Invalid refresh token');
        });
        it('should fail to refresh with an invalid device fingerprint', async () => {
            const { credentials } = await createTestUser('CUSTOMER');
            const { refreshToken: oldRefreshToken } = await login(credentials.email, credentials.password, credentials.deviceFingerprint);
            await expect(refreshToken(oldRefreshToken, 'wrong-fingerprint'))
                .rejects
                .toThrow('Invalid device fingerprint');
        });
    });
    describe('Logout', () => {
        it('should successfully logout a user', async () => {
            const { credentials } = await createTestUser('CUSTOMER');
            const { refreshToken: token } = await login(credentials.email, credentials.password, credentials.deviceFingerprint);
            await logout(token);
            const refreshToken = await prisma.refreshToken.findUnique({
                where: { token }
            });
            expect(refreshToken).toBeNull();
        });
        it('should handle logout with an invalid token', async () => {
            await expect(logout('invalid-token'))
                .rejects
                .toThrow('Invalid refresh token');
        });
    });
    describe('Rate Limiting', () => {
        it('should enforce rate limiting on login attempts', async () => {
            const { credentials } = await createTestUser('CUSTOMER');
            // Make multiple failed login attempts
            for (let i = 0; i < 5; i++) {
                try {
                    await login(credentials.email, 'wrongpassword', credentials.deviceFingerprint);
                }
                catch (error) {
                    // Expected error
                }
            }
            // Next attempt should be rate limited
            await expect(login(credentials.email, 'wrongpassword', credentials.deviceFingerprint))
                .rejects
                .toThrow('Too many login attempts');
        });
    });
});
