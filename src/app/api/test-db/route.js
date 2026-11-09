import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
export async function GET(request) {
    try {
        const auth = await requireAdmin(request);
        if (!auth.ok) return auth.response;
        // Test the connection by running a simple query
        const result = await sql `SELECT NOW()`;
        return NextResponse.json({ success: true, timestamp: result[0].now });
    }
    catch (error) {
        console.error('Database connection error:', error);
        return NextResponse.json({ error: 'Failed to connect to database' }, { status: 500 });
    }
}
