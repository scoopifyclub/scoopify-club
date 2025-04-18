import { prisma } from './setup';
import { NextResponse } from 'next/server';
import { signup } from '../app/api/auth/signup/route';
import { signin } from '../app/api/auth/signin/route';
import { verifyEmail } from '../app/api/auth/verify-email/route';
import { forgotPassword } from '../app/api/auth/forgot-password/route';
import { resetPassword } from '../app/api/auth/reset-password/route';
import { validatePassword } from '../lib/password';

describe('Authentication Tests', () => {
  describe('Password Validation', () => {
    it('should validate strong passwords correctly', () => {
      const strongPassword = 'Test123!@#';
      const result = validatePassword(strongPassword);
      expect(result.isValid).toBe(true);
      expect(result.strength).toBe('strong');
      expect(result.errors).toHaveLength(0);
    });

    it('should reject weak passwords', () => {
      const weakPassword = '123';
      const result = validatePassword(weakPassword);
      expect(result.isValid).toBe(false);
      expect(result.strength).toBe('weak');
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Signup Flow', () => {
    it('should create a new user with valid data', async () => {
      const userData = {
        email: 'test@test.com',
        password: 'Test123!@#',
        firstName: 'Test',
        lastName: 'User',
        phone: '1234567890',
        role: 'CUSTOMER',
      };

      const response = await signup(new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify(userData),
      }));

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.user).toBeDefined();
    });

    it('should reject duplicate email addresses', async () => {
      const userData = {
        email: 'test@test.com',
        password: 'Test123!@#',
        firstName: 'Test',
        lastName: 'User',
        phone: '1234567890',
        role: 'CUSTOMER',
      };

      const response = await signup(new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify(userData),
      }));

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Email already exists');
    });
  });

  describe('Login Flow', () => {
    it('should login with valid credentials', async () => {
      const credentials = {
        email: 'test@test.com',
        password: 'Test123!@#',
      };

      const response = await signin(new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }));

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.token).toBeDefined();
      expect(data.user).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const credentials = {
        email: 'test@test.com',
        password: 'WrongPassword123!',
      };

      const response = await signin(new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }));

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Invalid credentials');
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