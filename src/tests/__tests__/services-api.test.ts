import { NextRequest, NextResponse } from 'next/server';
import { POST, GET } from '@/app/api/services/route';
import prisma from "@/lib/prisma";
import { requireAuth } from '@/lib/api-auth';
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

jest.mock('@/lib/api-auth', () => ({
  requireAuth: jest.fn(),
}));

jest.mock('@/lib/email', () => ({
  sendServiceNotificationEmail: jest.fn(),
}));

jest.mock('@/middleware/db', () => ({
  withDatabase: (handler: any) => handler,
}));

describe('Services API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/services', () => {
    it('should create a new service for a valid customer request', async () => {
      // Setup mocks
      const mockUser = {
        id: 'user-id',
        role: 'CUSTOMER',
      };
      const mockCustomer = {
        id: 'customer-id',
        userId: 'user-id',
        user: { email: 'customer@example.com' },
        address: { street: '123 Test St' },
      };
      const mockServicePlan = {
        id: 'plan-id',
        name: 'Basic Plan',
        isActive: true,
      };
      const mockService = {
        id: 'service-id',
        customerId: 'customer-id',
        servicePlanId: 'plan-id',
        scheduledDate: new Date('2023-07-01T10:00:00Z'),
        status: 'SCHEDULED',
        specialInstructions: 'Test instructions',
        customer: mockCustomer,
        servicePlan: mockServicePlan,
      };

      // Set up the mocks
      (requireAuth as jest.Mock).mockResolvedValue(mockUser);
      (prisma.customer.findUnique as jest.Mock).mockResolvedValue(mockCustomer);
      (prisma.servicePlan.findUnique as jest.Mock).mockResolvedValue(mockServicePlan);
      (prisma.service.create as jest.Mock).mockResolvedValue(mockService);
      (sendServiceNotificationEmail as jest.Mock).mockResolvedValue(undefined);

      // Create the request
      const request = new NextRequest('http://localhost:3000/api/services', {
        method: 'POST',
        body: JSON.stringify({
          scheduledFor: '2023-07-01T10:00:00Z',
          servicePlanId: 'plan-id',
          specialInstructions: 'Test instructions',
        }),
      });

      // Call the handler
      const response = await POST(request);
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(responseData).toEqual(mockService);
      expect(requireAuth).toHaveBeenCalledWith(request);
      expect(prisma.customer.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-id' },
        include: {
          user: true,
          address: true,
        },
      });
      expect(prisma.servicePlan.findUnique).toHaveBeenCalledWith({
        where: { id: 'plan-id' },
      });
      expect(prisma.service.create).toHaveBeenCalledWith({
        data: {
          customerId: 'customer-id',
          servicePlanId: 'plan-id',
          scheduledDate: new Date('2023-07-01T10:00:00Z'),
          status: 'SCHEDULED',
          specialInstructions: 'Test instructions',
        },
        include: {
          customer: {
            include: {
              user: true,
              address: true,
            },
          },
          servicePlan: true,
        },
      });
      expect(sendServiceNotificationEmail).toHaveBeenCalledWith(mockService);
    });

    it('should return 401 if user is not a customer', async () => {
      // Setup mocks
      const mockUser = {
        id: 'user-id',
        role: 'EMPLOYEE',
      };

      // Set up the mocks
      (requireAuth as jest.Mock).mockResolvedValue(mockUser);

      // Create the request
      const request = new NextRequest('http://localhost:3000/api/services', {
        method: 'POST',
        body: JSON.stringify({
          scheduledFor: '2023-07-01T10:00:00Z',
          servicePlanId: 'plan-id',
          specialInstructions: 'Test instructions',
        }),
      });

      // Call the handler
      const response = await POST(request);
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(401);
      expect(responseData).toEqual({ error: 'Unauthorized' });
    });

    it('should return 400 if service plan ID is missing', async () => {
      // Setup mocks
      const mockUser = {
        id: 'user-id',
        role: 'CUSTOMER',
      };

      // Set up the mocks
      (requireAuth as jest.Mock).mockResolvedValue(mockUser);

      // Create the request
      const request = new NextRequest('http://localhost:3000/api/services', {
        method: 'POST',
        body: JSON.stringify({
          scheduledFor: '2023-07-01T10:00:00Z',
          // Missing servicePlanId
          specialInstructions: 'Test instructions',
        }),
      });

      // Call the handler
      const response = await POST(request);
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(responseData).toEqual({ error: 'Service plan ID is required' });
    });

    it('should return 404 if customer is not found', async () => {
      // Setup mocks
      const mockUser = {
        id: 'user-id',
        role: 'CUSTOMER',
      };

      // Set up the mocks
      (requireAuth as jest.Mock).mockResolvedValue(mockUser);
      (prisma.customer.findUnique as jest.Mock).mockResolvedValue(null);

      // Create the request
      const request = new NextRequest('http://localhost:3000/api/services', {
        method: 'POST',
        body: JSON.stringify({
          scheduledFor: '2023-07-01T10:00:00Z',
          servicePlanId: 'plan-id',
          specialInstructions: 'Test instructions',
        }),
      });

      // Call the handler
      const response = await POST(request);
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(404);
      expect(responseData).toEqual({ error: 'Customer not found' });
    });
  });

  describe('GET /api/services', () => {
    it('should return services filtered by date range and user role', async () => {
      // Setup mocks
      const mockUser = {
        id: 'user-id',
        role: 'CUSTOMER',
        customerId: 'customer-id',
      };
      const mockServices = [
        {
          id: 'service-id-1',
          customerId: 'customer-id',
          servicePlanId: 'plan-id',
          scheduledDate: new Date('2023-07-01T10:00:00Z'),
          status: 'SCHEDULED',
        },
        {
          id: 'service-id-2',
          customerId: 'customer-id',
          servicePlanId: 'plan-id',
          scheduledDate: new Date('2023-07-02T10:00:00Z'),
          status: 'SCHEDULED',
        },
      ];

      // Set up the mocks
      (requireAuth as jest.Mock).mockResolvedValue(mockUser);
      (prisma.service.findMany as jest.Mock).mockResolvedValue(mockServices);

      // Create the request
      const request = new NextRequest(
        'http://localhost:3000/api/services?startDate=2023-07-01&endDate=2023-07-03',
        { method: 'GET' }
      );

      // Call the handler
      const response = await GET(request);
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(responseData).toEqual(mockServices);
      expect(requireAuth).toHaveBeenCalledWith(request);
      expect(prisma.service.findMany).toHaveBeenCalledWith({
        where: {
          scheduledDate: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
          customerId: 'customer-id',
        },
        include: {
          customer: {
            include: {
              user: true,
              address: true,
            },
          },
          employee: {
            include: {
              user: true,
            },
          },
          servicePlan: true,
        },
        orderBy: {
          scheduledDate: 'asc',
        },
      });
    });

    it('should return 400 if date range parameters are missing', async () => {
      // Setup mocks
      const mockUser = {
        id: 'user-id',
        role: 'CUSTOMER',
        customerId: 'customer-id',
      };

      // Set up the mocks
      (requireAuth as jest.Mock).mockResolvedValue(mockUser);

      // Create the request with missing parameters
      const request = new NextRequest(
        'http://localhost:3000/api/services',
        { method: 'GET' }
      );

      // Call the handler
      const response = await GET(request);
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(responseData).toEqual({ error: 'Start and end dates are required' });
    });
  });
}); 