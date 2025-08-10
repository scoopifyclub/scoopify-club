import { NextResponse } from 'next/server';
import { withAdminDatabase } from '@/lib/prisma';
import { validateUserToken } from '@/lib/jwt-utils';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function GET(request) {
    try {
        const token = request.headers.get('authorization')?.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

                       const decoded = await validateUserToken(token);
        if (!decoded || decoded.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userInfo = await withAdminDatabase(async (prisma) => {
            console.log('👤 Fetching admin user info...');

            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    emailVerified: true,
                    createdAt: true,
                    updatedAt: true
                }
            });

            if (!user) {
                throw new Error('User not found');
            }

            return user;
        });

        return NextResponse.json({
            success: true,
            user: userInfo
        });

    } catch (error) {
        console.error('Error fetching user info:', error);
        return NextResponse.json({ 
            success: false,
            error: 'Failed to fetch user info' 
        }, { status: 500 });
    }
}
