import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/api-auth';
export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('adminToken');
        if (!token) {
            return NextResponse.json({ error: 'No token found' }, { status: 401 });
        }
        const decoded = await verifyToken(token.value);
        if (!decoded || decoded.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
        }
        return NextResponse.json({
            success: true,
            user: {
                id: decoded.id,
                email: decoded.email,
                role: decoded.role
            }
        });
    }
    catch (error) {
        console.error('Token verification error:', error);
        return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
}
// Add POST method that does the same thing as GET
export async function POST() {
    return GET();
}
// Handle OPTIONS request for CORS preflight
export async function OPTIONS(request) {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
}
