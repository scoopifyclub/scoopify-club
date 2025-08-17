import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(request) {
    try {
        // Get all active service plans
        const plans = await prisma.servicePlan.findMany({
            where: {
                isActive: true
            },
            orderBy: {
                price: 'asc'
            }
        });

        return NextResponse.json({
            success: true,
            plans: plans.map(plan => ({
                id: plan.id,
                name: plan.name,
                description: plan.description,
                price: plan.price,
                duration: plan.duration,
                type: plan.type
            }))
        });

    } catch (error) {
        console.error('Error fetching service plans:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch service plans',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        }, { status: 500 });
    }
}

export async function OPTIONS(request) {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
}
