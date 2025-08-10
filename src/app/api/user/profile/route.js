import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { validateUser } from '@/lib/api-auth';
import { cookies } from 'next/headers';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function GET(request) {
    var _a;
    try {
        // Get access token from cookies
        const cookieStore = cookies();
        const accessToken = (_a = cookieStore.get('accessToken')) === null || _a === void 0 ? void 0 : _a.value;
        if (!accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Validate the token and check role
        const user = await validateUser(accessToken);
        console.log('Fetching profile for user:', user.userId);
        const userProfile = await prisma.user.findUnique({
            where: { id: user.userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                customer: user.role === 'CUSTOMER' ? {
                    select: {
                        address: true,
                        coordinates: true,
                        subscription: {
                            select: {
                                plan: true,
                                price: true,
                                status: true
                            }
                        }
                    }
                } : false,
                employee: user.role === 'EMPLOYEE' ? {
                    select: {
                        status: true,
                        rating: true,
                        completedServices: true
                    }
                } : false
            }
        });
        console.log('Found user profile:', userProfile ? { id: userProfile.id, role: userProfile.role } : 'null');
        if (!userProfile) {
            console.log('User profile not found for ID:', user.userId);
            return NextResponse.json({ message: 'User profile not found' }, { status: 404 });
        }
        return NextResponse.json(userProfile);
    }
    catch (error) {
        console.error('Error in profile API:', error);
        return NextResponse.json({ message: 'Failed to fetch user profile', error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}
