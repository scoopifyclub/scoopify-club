import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { verifyToken, refreshToken } from '@/lib/auth';

export async function GET(request) {
    try {
        // Get access token from cookies
        const accessToken = request.cookies.get('accessToken')?.value;

        if (!accessToken) {
            return NextResponse.json(
                { error: 'No session found' },
                { status: 401 }
            );
        }

        // Verify the token
        const payload = await verifyToken(accessToken);

        if (!payload) {
            return NextResponse.json(
                { error: 'Invalid session' },
                { status: 401 }
            );
        }

        // Return user data
        return NextResponse.json({
            user: {
                id: payload.id,
                email: payload.email,
                role: payload.role,
                name: payload.name,
                customerId: payload.customerId,
                employeeId: payload.employeeId
            }
        });
    } catch (error) {
        console.error('Session verification error:', error);
        return NextResponse.json(
            { error: 'An error occurred while verifying session' },
            { status: 500 }
        );
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400',
        },
    });
}
