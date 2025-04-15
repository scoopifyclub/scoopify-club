import { NextResponse } from 'next/server'
import { middleware } from '@/middleware'
import { verify } from 'jsonwebtoken'

// Mock the verify function
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}))

// Mock Redis
jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(true),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
  })),
}))

describe('Middleware Navigation Flow', () => {
  const mockRequest = (path: string, cookies: Record<string, string> = {}) => {
    const url = new URL(`http://localhost:3000${path}`)
    return {
      nextUrl: url,
      url: url.toString(),
      cookies: {
        get: (name: string) => cookies[name] ? { value: cookies[name] } : undefined,
        has: (name: string) => name in cookies,
      },
      headers: new Headers({
        'origin': 'http://localhost:3000',
        'x-forwarded-for': '127.0.0.1',
      }),
    } as any
  }

  beforeEach(() => {
    (verify as jest.Mock).mockClear()
    process.env.REDIS_URL = 'https://test-redis-url'
    process.env.REDIS_TOKEN = 'test-redis-token'
  })

  describe('Public Routes', () => {
    it('should allow access to public routes without authentication', async () => {
      const request = mockRequest('/')
      const response = await middleware(request)
      expect(response).toBe(NextResponse.next())
    })

    it('should allow access to login page without authentication', async () => {
      const request = mockRequest('/login')
      const response = await middleware(request)
      expect(response).toBe(NextResponse.next())
    })
  })

  describe('Protected Routes', () => {
    it('should redirect to login page when accessing protected route without token', async () => {
      const request = mockRequest('/dashboard')
      const response = await middleware(request)
      expect(response.headers.get('location')).toBe('http://localhost:3000/login')
    })

    it('should redirect to employee login page when accessing employee route without token', async () => {
      const request = mockRequest('/employee/dashboard')
      const response = await middleware(request)
      expect(response.headers.get('location')).toBe('http://localhost:3000/employee/login')
    })
  })

  describe('Role-Based Access', () => {
    it('should allow customer access to dashboard with valid token', async () => {
      (verify as jest.Mock).mockReturnValue({
        id: '1',
        email: 'customer@example.com',
        role: 'CUSTOMER',
      })

      const request = mockRequest('/dashboard', {
        token: 'valid-token',
        userType: 'customer',
      })

      const response = await middleware(request)
      expect(response).toBe(NextResponse.next())
    })

    it('should redirect employee to employee dashboard when accessing customer dashboard', async () => {
      (verify as jest.Mock).mockReturnValue({
        id: '1',
        email: 'employee@example.com',
        role: 'EMPLOYEE',
      })

      const request = mockRequest('/dashboard', {
        token: 'valid-token',
        userType: 'employee',
      })

      const response = await middleware(request)
      expect(response.headers.get('location')).toBe('http://localhost:3000/employee/dashboard')
    })

    it('should redirect customer to dashboard when accessing employee routes', async () => {
      (verify as jest.Mock).mockReturnValue({
        id: '1',
        email: 'customer@example.com',
        role: 'CUSTOMER',
      })

      const request = mockRequest('/employee/dashboard', {
        token: 'valid-token',
        userType: 'customer',
      })

      const response = await middleware(request)
      expect(response.headers.get('location')).toBe('http://localhost:3000/dashboard')
    })
  })

  describe('Invalid Token Handling', () => {
    it('should clear cookies and redirect to login when token is invalid', async () => {
      (verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token')
      })

      const request = mockRequest('/dashboard', {
        token: 'invalid-token',
        userType: 'customer',
      })

      const response = await middleware(request)
      expect(response.headers.get('location')).toBe('http://localhost:3000/login')
      
      // Check if cookies are cleared
      const setCookieHeader = response.headers.get('set-cookie')
      expect(setCookieHeader).toContain('token=;')
      expect(setCookieHeader).toContain('userType=;')
    })
  })
}) 