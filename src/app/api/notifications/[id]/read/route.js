import { NextResponse } from 'next/server';
import { validateUser } from '@/lib/api-auth';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function POST(request, { params }) {
    var _a;
    try {
        // Get access token from cookies
        const cookieStore = await cookies();
        const accessToken = (_a = cookieStore.get('accessToken')) === null || _a === void 0 ? void 0 : _a.value;
        if (!accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Validate the token and check role
        const { userId, role } = await validateUser(accessToken);
        if (!(session === null || session === void 0 ? void 0 : session.user)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const notification = await prisma.notification.update({
            where: {
                id: (await params).id,
                userId: userId,
            },
            data: {
                read: true,
            },
        });
        return NextResponse.json(notification);
    }
    catch (error) {
        console.error('Error marking notification as read:', error);
        return NextResponse.json({ error: 'Failed to mark notification as read' }, { status: 500 });
    }
}
