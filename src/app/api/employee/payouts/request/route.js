import { NextResponse } from 'next/server';
import { validateUserToken } from '@/lib/jwt-utils';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

// Validation schema for payout request
const payoutRequestSchema = z.object({
    paymentMethod: z.enum(['STRIPE', 'CASH_APP']),
    serviceIds: z.array(z.string().uuid()),
    amount: z.number().positive()
});

export async function POST(request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('accessToken')?.value || 
                     cookieStore.get('token')?.value || 
                     cookieStore.get('refreshToken')?.value;
        
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized - No token' }, { status: 401 });
        }
        
        const decoded = await validateUserToken(token);
        if (!decoded || decoded.role !== 'EMPLOYEE') {
            return NextResponse.json({ error: 'Unauthorized - Not employee' }, { status: 401 });
        }

        // Get employee record
        const employee = await prisma.employee.findUnique({
            where: { userId: decoded.userId }
        });

        if (!employee) {
            return NextResponse.json({ error: 'Employee profile not found' }, { status: 404 });
        }

        // Parse and validate request body
        const body = await request.json();
        const validatedData = payoutRequestSchema.parse(body);

        // Verify all services belong to this employee and are eligible for payout
        const services = await prisma.service.findMany({
            where: {
                id: { in: validatedData.serviceIds },
                employeeId: employee.id,
                status: 'COMPLETED',
                paymentStatus: 'PENDING'
            },
            include: {
                servicePlan: true
            }
        });

        if (services.length !== validatedData.serviceIds.length) {
            return NextResponse.json({ 
                error: 'Some services are not eligible for payout' 
            }, { status: 400 });
        }

        // Calculate total amount from services
        const totalAmount = services.reduce((sum, service) => {
            return sum + (service.potentialEarnings || 0);
        }, 0);

        // Verify requested amount matches calculated amount
        if (Math.abs(totalAmount - validatedData.amount) > 0.01) {
            return NextResponse.json({ 
                error: 'Requested amount does not match service earnings' 
            }, { status: 400 });
        }

        // Create payout request
        const payoutRequest = await prisma.payoutRequest.create({
            data: {
                employeeId: employee.id,
                amount: validatedData.amount,
                paymentMethod: validatedData.paymentMethod,
                status: 'PENDING',
                serviceIds: validatedData.serviceIds,
                requestedAt: new Date()
            }
        });

        // Update services to mark them as payout requested
        await prisma.service.updateMany({
            where: {
                id: { in: validatedData.serviceIds }
            },
            data: {
                paymentStatus: 'PAYOUT_REQUESTED'
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Payout request submitted successfully',
            payoutRequest: {
                id: payoutRequest.id,
                amount: payoutRequest.amount,
                paymentMethod: payoutRequest.paymentMethod,
                status: payoutRequest.status,
                requestedAt: payoutRequest.requestedAt
            }
        });

    } catch (error) {
        console.error('Error creating payout request:', error);
        
        if (error instanceof z.ZodError) {
            return NextResponse.json({ 
                error: 'Invalid request data', 
                details: error.errors 
            }, { status: 400 });
        }
        
        return NextResponse.json({ 
            error: 'Failed to create payout request',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        }, { status: 500 });
    }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(request) {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
} 