import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { requireAdmin } from '@/lib/admin-auth';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';


export async function GET(request) {
    try {
        const auth = await requireAdmin(request);
        if (!auth.ok) return auth.response;
        // Test basic Prisma connection
        const customerCount = await prisma.customer.count();
        const serviceCount = await prisma.service.count();
        
        return NextResponse.json({
            status: 'ok',
            customerCount,
            serviceCount,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Prisma test error:', error);
        return NextResponse.json({
            error: 'Database connection failed',
            details: error.message
        }, { status: 500 });
    }
} 