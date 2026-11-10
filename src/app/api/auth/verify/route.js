import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/api-auth';
import { getRequestAuthToken } from '@/lib/auth-cookies';

export async function GET(request) {
    try {
        const token = await getRequestAuthToken(request);

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

        return NextResponse.json({ 
            success: true, 
            user: decoded
        });
    } catch (error) {
        console.error('Verify token error:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Token verification failed' 
        }, { status: 401 });
    }
}
