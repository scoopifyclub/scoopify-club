import { verifyToken } from './auth';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from './prisma';

export async function getAuthUser(request) {
    const token = request.cookies.get('token')?.value;
    if (!token) {
        return null;
    }

    const payload = await verifyToken(token);
    if (!payload) {
        return null;
    }

    return payload;
}

export async function requireAuth(request, options = {}) {
    const { role = null, roles = [] } = options;
    
    try {
        const token = request.cookies.get('token')?.value;
        if (!token) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const payload = await verifyToken(token);
        if (!payload) {
            return NextResponse.json(
                { error: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        // Check role if specified
        if (role && payload.role !== role) {
            return NextResponse.json(
                { error: 'Unauthorized access' },
                { status: 403 }
            );
        }

        // Check roles array if specified
        if (roles.length > 0 && !roles.includes(payload.role)) {
            return NextResponse.json(
                { error: 'Unauthorized access' },
                { status: 403 }
            );
        }

        // Get full user data if needed
        const user = await prisma.user.findUnique({
            where: { id: payload.id },
            include: {
                customer: true,
                employee: true
            }
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return {
            ...user,
            customerId: user.customer?.id,
            employeeId: user.employee?.id
        };
    } catch (error) {
        console.error('Auth error:', error);
        return NextResponse.json(
            { error: 'Authentication failed' },
            { status: 401 }
        );
    }
}

export function withErrorHandler(handler) {
    return async (request, ...args) => {
        try {
            return await handler(request, ...args);
        } catch (error) {
            console.error('API error:', error);
            return NextResponse.json(
                { error: 'Internal server error' },
                { status: 500 }
            );
        }
    };
}

export function withAuth(handler, options = {}) {
    return async (request, ...args) => {
        const user = await requireAuth(request, options);
        if (user instanceof NextResponse) {
            return user; // Return error response
        }
        return handler(request, user, ...args);
    };
}
