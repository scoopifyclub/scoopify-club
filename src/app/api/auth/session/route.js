import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validateUserToken } from '@/lib/jwt-utils';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
    try {
        const cookieStore = await cookies();
        
        // Try to get token from various cookie names
        const token = cookieStore.get('accessToken')?.value || 
                     cookieStore.get('token')?.value || 
                     cookieStore.get('accessToken_client')?.value;

        if (!token) {
            return NextResponse.json({ error: 'No token found' }, { status: 401 });
        }

        // Validate the token
        const userData = await validateUserToken(token);
        if (!userData) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // Get user with role and related data
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

        // Return user data with role-specific information
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

// Helper function to parse cookies
function parseCookies(cookieHeader) {
    const cookies = {};
    if (!cookieHeader) return cookies;
    
    cookieHeader.split(';').forEach(cookie => {
        const [name, ...rest] = cookie.split('=');
        if (name) {
            const cookieName = name.trim();
            const cookieValue = rest.join('=').trim();
            if (cookieValue) {
                cookies[cookieName] = cookieValue;
            }
        }
    });
    
    return cookies;
}

// Also handle OPTIONS request for CORS
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
