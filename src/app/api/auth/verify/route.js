import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ 
                success: false, 
                error: 'No token found' 
            }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        
        if (!decoded) {
            return NextResponse.json({ 
                success: false, 
                error: 'Invalid token' 
            }, { status: 401 });
        }

        // Remove sensitive information
        const { password, ...user } = decoded;

        return NextResponse.json({ 
            success: true, 
            user 
        });
    } catch (error) {
        console.error('Verify token error:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Token verification failed' 
        }, { status: 401 });
    }
} 