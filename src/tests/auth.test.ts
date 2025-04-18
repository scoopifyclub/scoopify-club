import { prisma, testUsers, createTestUser, createTestRequest, createTestResponse } from './setup';
import { login } from '../app/api/auth/login/route';
import { signup } from '../app/api/auth/signup/route';
import { refreshToken } from '../app/api/auth/refresh/route';
import { logout } from '../app/api/auth/logout/route';
import { verifyToken } from '../lib/auth';
import { NextResponse } from 'next/server';
import { verifyEmail } from '../app/api/auth/verify-email/route';
import { forgotPassword } from '../app/api/auth/forgot-password/route';
import { resetPassword } from '../app/api/auth/reset-password/route';
import { validatePassword } from '../lib/password';

describe('Authentication System', () => {
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
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
          user: expect.objectContaining({
            id: user.id,
            email: user.email,
            role: user.role,
          }),
        })
      );
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
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Invalid email or password',
        })
      );
    });

    it('should fail login with non-existent email', async () => {
      const request = createTestRequest('POST', {
        email: 'nonexistent@test.com',
        password: 'anypassword',
      });
      const response = createTestResponse();

      await login(request, response);

      expect(response.status).toHaveBeenCalledWith(401);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Invalid email or password',
        })
      );
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
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            email: 'newuser@test.com',
            name: 'New User',
            role: 'CUSTOMER',
          }),
        })
      );

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
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Email already exists',
        })
      );
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
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Password'),
        })
      );
    });
  });

  describe('Token Refresh Flow', () => {
    it('should refresh token successfully', async () => {
      const user = await createTestUser(testUsers.customer);
      const refreshToken = await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: 'valid-refresh-token' },
      });

      const request = createTestRequest('POST', {
        refreshToken: 'valid-refresh-token',
      });
      const response = createTestResponse();

      await refreshToken(request, response);

      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: expect.any(String),
        })
      );
    });

    it('should fail refresh with invalid token', async () => {
      const request = createTestRequest('POST', {
        refreshToken: 'invalid-token',
      });
      const response = createTestResponse();

      await refreshToken(request, response);

      expect(response.status).toHaveBeenCalledWith(401);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Invalid refresh token',
        })
      );
    });
  });

  describe('Logout Flow', () => {
    it('should logout successfully', async () => {
      const user = await createTestUser(testUsers.customer);
      const request = createTestRequest('POST', {
        refreshToken: 'valid-refresh-token',
      }, {}, {
        token: 'valid-access-token',
      });
      const response = createTestResponse();

      await logout(request, response);

      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );

      // Verify refresh token was cleared
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });
      expect(updatedUser?.refreshToken).toBeNull();
    });
  });

  describe('Token Verification', () => {
    it('should verify valid token', async () => {
      const user = await createTestUser(testUsers.customer);
      const token = await verifyToken('valid-token');
      expect(token).toBeTruthy();
      expect(token?.id).toBe(user.id);
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
      // First, get the verification token for the test user
      const user = await prisma.user.findUnique({
        where: { email: 'test@test.com' },
        include: { emailVerification: true },
      });

      if (!user?.emailVerification?.token) {
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
      // First, get the reset token for the test user
      const user = await prisma.user.findUnique({
        where: { email: 'test@test.com' },
        include: { passwordResetToken: true },
      });

      if (!user?.passwordResetToken?.token) {
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
}); 