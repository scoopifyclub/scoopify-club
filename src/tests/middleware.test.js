import { NextResponse } from 'next/server';
import { middleware } from '../middleware';
import { getToken } from 'next-auth/jwt';
import { rateLimit } from '../middleware/rate-limit';
// Mock next-auth/jwt
jest.mock('next-auth/jwt', () => ({
    getToken: jest.fn(),
}));
// Mock Prisma
jest.mock('@/lib/prisma', () => ({
    rateLimit: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
    },
}));
// Mock rate limiting
jest.mock('../middleware/rate-limit', () => ({
    rateLimit: jest.fn(),
}));
// Mock NextResponse
jest.mock('next/server', () => ({
    NextResponse: {
        next: jest.fn().mockReturnValue({ headers: new Headers() }),
        redirect: jest.fn().mockReturnValue({ headers: new Headers() }),
        json: jest.fn().mockReturnValue({
            headers: new Headers(),
            status: 429
        }),
    },
}));
describe('Middleware Navigation Flow', () => {
    const mockRequest = (path, cookies = {}) => {
        const url = new URL(`http://localhost:3000${path}`);
        return {
            nextUrl: url,
            url: url.toString(),
            cookies: {
                get: (name) => cookies[name] ? { value: cookies[name] } : undefined,
                has: (name) => name in cookies,
            },
            headers: new Headers({
                'origin': 'http://localhost:3000',
                'x-forwarded-for': '127.0.0.1',
            }),
        };
    };
    beforeEach(() => {
        getToken.mockClear()(rateLimit).mockClear();
    });
    describe('Public Routes', () => {
        it('should allow access to public routes without authentication', async () => {
            const request = mockRequest('/');
            const response = await middleware(request);
            expect(response).toBeDefined();
        });
        it('should allow access to login page without authentication', async () => {
            const request = mockRequest('/login');
            const response = await middleware(request);
            expect(response).toBeDefined();
        });
    });
    describe('Protected Routes', () => {
        it('should redirect to login page when accessing protected route without token', async () => {
            getToken.mockResolvedValue(null);
            const request = mockRequest('/dashboard');
            const response = await middleware(request);
            expect(NextResponse.redirect).toHaveBeenCalled();
        });
        it('should redirect to employee login page when accessing employee route without token', async () => {
            const request = mockRequest('/employee/dashboard');
            const response = await middleware(request);
            expect(response.headers.get('location')).toBe('http://localhost:3000/employee/login');
        });
    });
    describe('Role-Based Access', () => {
        it('should allow customer access to dashboard with valid token', async () => {
            getToken.mockResolvedValue({
                id: '1',
                email: 'customer@example.com',
                role: 'CUSTOMER',
            })(rateLimit).mockResolvedValue(null);
            const request = mockRequest('/dashboard', {
                token: 'valid-token',
                userType: 'customer',
            });
            const response = await middleware(request);
            expect(response).toBeDefined();
        });
        it('should redirect employee to employee dashboard when accessing customer dashboard', async () => {
            getToken.mockResolvedValue({
                id: '1',
                email: 'employee@example.com',
                role: 'EMPLOYEE',
            });
            const request = mockRequest('/dashboard', {
                token: 'valid-token',
                userType: 'employee',
            });
            const response = await middleware(request);
            expect(response.headers.get('location')).toBe('http://localhost:3000/employee/dashboard');
        });
        it('should redirect customer to dashboard when accessing employee routes', async () => {
            getToken.mockResolvedValue({
                id: '1',
                email: 'customer@example.com',
                role: 'CUSTOMER',
            });
            const request = mockRequest('/employee/dashboard', {
                token: 'valid-token',
                userType: 'customer',
            });
            const response = await middleware(request);
            expect(response.headers.get('location')).toBe('http://localhost:3000/dashboard');
        });
    });
    describe('Invalid Token Handling', () => {
        it('should clear cookies and redirect to login when token is invalid', async () => {
            getToken.mockImplementation(() => {
                throw new Error('Invalid token');
            });
            const request = mockRequest('/dashboard', {
                token: 'invalid-token',
                userType: 'customer',
            });
            const response = await middleware(request);
            expect(response.headers.get('location')).toBe('http://localhost:3000/login');
            // Check if cookies are cleared
            const setCookieHeader = response.headers.get('set-cookie');
            expect(setCookieHeader).toContain('token=;');
            expect(setCookieHeader).toContain('userType=;');
        });
    });
    describe('Rate Limiting', () => {
        it('should handle rate limiting', async () => {
            getToken.mockResolvedValue({ role: 'CUSTOMER' })(rateLimit).mockResolvedValue(NextResponse.json({ error: 'Too many requests' }, { status: 429 }));
            const request = mockRequest('/dashboard', {
                token: 'valid-token',
                userType: 'customer',
            });
            const response = await middleware(request);
            expect(response.status).toBe(429);
        });
    });
});
