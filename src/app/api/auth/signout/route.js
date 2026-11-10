import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { clearSessionCookiesOnStore } from '@/lib/auth-cookies';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function POST() {
    try {
        const cookieStore = await cookies();
        clearSessionCookiesOnStore(cookieStore);

        console.log('🔐 User signed out, all auth cookies cleared');

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Signout error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to sign out'
        }, { status: 500 });
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400',
        },
    });
}
