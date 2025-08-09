import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
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