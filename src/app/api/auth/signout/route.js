import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { revokeUserTokenByFingerprint, verifyToken } from '@/lib/api-auth';

export async function POST() {
    const cookieStore = cookies();
    cookieStore.delete('token');

    return NextResponse.json({ success: true });
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