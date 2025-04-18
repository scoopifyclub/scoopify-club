import { jest } from '@jest/globals';
import { prisma } from '../../../../tests/setup';
import { POST as signup } from '../signup/route';
import { POST as signin } from '../signin/route';
import { POST as verifyEmail } from '../verify-email/route';
import { POST as forgotPassword } from '../forgot-password/route';
import { POST as resetPassword } from '../reset-password/route';
import { sendEmail } from '@/lib/email';

// Mock the email sending function
jest.mock('@/lib/email', () => ({
  sendEmail: jest.fn().mockResolvedValue(true)
}));

// Mock Request object
const mockRequest = (body: any) => ({
  json: () => Promise.resolve(body)
} as Request);

describe('Authentication', () => {
  beforeAll(async () => {
    // Clean up any existing test users
    try {
      await prisma.user.deleteMany({
        where: {
          email: {
            contains: 'test'
          }
        }
      });
    } catch (error) {
      // If tables don't exist, that's fine - we'll create them
      console.log('Tables not found, will be created by migrations');
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Signup', () => {
    it('should create a new user successfully', async () => {
      const response = await signup(mockRequest({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '555-0123',
        password: 'Test123!@#',
        street: '123 Test St',
        city: 'Test City',
        state: 'CA',
        zipCode: '12345',
        gateCode: '1234',
        serviceDay: 'MONDAY'
      }));

      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe('test@example.com');
      expect(data.user.customer).toBeDefined();
      expect(data.user.customer.address).toBeDefined();
      expect(data.user.customer.gateCode).toBe('1234');
      expect(data.user.customer.serviceDay).toBe('MONDAY');
    });

    it('should reject duplicate email', async () => {
      const response = await signup(mockRequest({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '555-0123',
        password: 'Test123!@#',
        street: '123 Test St',
        city: 'Test City',
        state: 'CA',
        zipCode: '12345',
        gateCode: '1234',
        serviceDay: 'MONDAY'
      }));

      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBe('User with this email already exists');
    });

    it('should reject weak password', async () => {
      const response = await signup(mockRequest({
        firstName: 'Test',
        lastName: 'User',
        email: 'test2@example.com',
        phone: '555-0123',
        password: 'weak',
        street: '123 Test St',
        city: 'Test City',
        state: 'CA',
        zipCode: '12345'
      }));

      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid password');
      expect(data.details).toBeDefined();
      expect(data.strength).toBeDefined();
    });
  });

  describe('Signin', () => {
    it('should sign in user with valid credentials', async () => {
      const response = await signin(mockRequest({
        email: 'test@example.com',
        password: 'Test123!@#'
      }));

      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.token).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const response = await signin(mockRequest({
        email: 'test@example.com',
        password: 'WrongPassword123!'
      }));

      const data = await response.json();
      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid credentials');
    });
  });

  describe('Email Verification', () => {
    let verificationToken: string;

    beforeAll(async () => {
      // Get the verification token from the database
      const user = await prisma.user.findUnique({
        where: { email: 'test@example.com' }
      });
      verificationToken = user?.verificationToken || '';

      // If no token exists, create one
      if (!verificationToken) {
        const updatedUser = await prisma.user.update({
          where: { email: 'test@example.com' },
          data: {
            verificationToken: 'test-verification-token',
            verificationTokenExpiry: new Date(Date.now() + 3600000) // 1 hour from now
          }
        });
        verificationToken = updatedUser.verificationToken || '';
      }
    });

    it('should verify email with valid token', async () => {
      const response = await verifyEmail(mockRequest({
        token: verificationToken
      }));

      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should reject invalid verification token', async () => {
      const response = await verifyEmail(mockRequest({
        token: 'invalid-token'
      }));

      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid or expired verification token');
    });
  });

  describe('Password Reset', () => {
    let resetToken: string;

    beforeAll(async () => {
      // Request password reset
      await forgotPassword(mockRequest({
        email: 'test@example.com'
      }));

      // Get the reset token from the database
      const user = await prisma.user.findUnique({
        where: { email: 'test@example.com' }
      });
      resetToken = user?.resetToken || '';
    });

    it('should reset password with valid token', async () => {
      const response = await resetPassword(mockRequest({
        token: resetToken,
        newPassword: 'NewTest123!@#'
      }));

      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify new password works
      const signinResponse = await signin(mockRequest({
        email: 'test@example.com',
        password: 'NewTest123!@#'
      }));

      const signinData = await signinResponse.json();
      expect(signinResponse.status).toBe(200);
      expect(signinData.token).toBeDefined();
    });

    it('should reject invalid reset token', async () => {
      const response = await resetPassword(mockRequest({
        token: 'invalid-token',
        newPassword: 'NewTest123!@#'
      }));

      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid or expired reset token');
    });
  });
});