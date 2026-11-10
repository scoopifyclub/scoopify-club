import { NextResponse } from 'next/server';
import { validateUserToken, isCurrentSessionVersion } from '@/lib/jwt-utils';
import { prisma } from '@/lib/prisma';
import { getRequestAuthToken } from '@/lib/auth-cookies';

export async function GET(request) {
    try {
        const token = await getRequestAuthToken(request);

        if (!token) {
            return NextResponse.json({ error: 'No token found' }, { status: 401 });
        }

        const userData = await validateUserToken(token);
        if (!userData) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userData.userId },
            include: {
                customer: {
                    include: {
                        address: true,
                        services: {
                            take: 5,
                            orderBy: { scheduledDate: 'desc' }
                        }
                    }
                },
                employee: {
                    include: {
                        serviceAreas: true
                    }
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (!(await isCurrentSessionVersion(user, userData.sv))) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                customer: user.customer,
                employee: user.employee
            }
        });

    } catch (error) {
        console.error('Session error:', error);
        return NextResponse.json(
            { error: 'Failed to get session' }, 
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
