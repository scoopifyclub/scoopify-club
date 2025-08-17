import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { validateUserToken } from '@/lib/jwt-utils';
import { cookies } from 'next/headers';
import { z } from 'zod';

export const runtime = 'nodejs';

// Validation schema for reschedule request
const rescheduleSchema = z.object({
    newDate: z.string().datetime(),
});

export async function POST(request, { params }) {
    try {
        const { id: serviceId } = params;
        
        // Get and validate token
        const cookieStore = await cookies();
        const token = cookieStore.get('accessToken')?.value;
        
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userId } = await validateUserToken(token, 'CUSTOMER');
        
        // Get the service and validate ownership
        const service = await prisma.service.findFirst({
            where: {
                id: serviceId,
                customer: {
                    userId: userId
                }
            },
            include: {
                customer: {
                    select: {
                        serviceDay: true
                    }
                }
            }
        });

        if (!service) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 });
        }

        // Check if service can be rescheduled (not completed, cancelled, etc.)
        if (service.status !== 'SCHEDULED' && service.status !== 'PENDING') {
            return NextResponse.json({ 
                error: 'Service cannot be rescheduled. Only scheduled or pending services can be rescheduled.' 
            }, { status: 400 });
        }

        // Parse request body
        const body = await request.json();
        const validatedData = rescheduleSchema.parse(body);
        
        const newDate = new Date(validatedData.newDate);
        const originalDate = new Date(service.scheduledDate);
        
        // Calculate the difference in days
        const timeDiff = newDate.getTime() - originalDate.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        // Check if the new date is within ±3 days
        if (Math.abs(daysDiff) > 3) {
            return NextResponse.json({ 
                error: 'Services can only be rescheduled within 3 days of the original date' 
            }, { status: 400 });
        }

        // Check if the new date is in the past
        if (newDate < new Date()) {
            return NextResponse.json({ 
                error: 'Cannot reschedule to a past date' 
            }, { status: 400 });
        }

        // Update the service with the new date
        const updatedService = await prisma.service.update({
            where: { id: serviceId },
            data: {
                scheduledDate: newDate,
                updatedAt: new Date()
            },
            include: {
                servicePlan: {
                    select: {
                        name: true,
                        price: true,
                        duration: true
                    }
                }
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Service rescheduled successfully',
            service: updatedService
        });

    } catch (error) {
        console.error('Reschedule service error:', error);
        
        if (error instanceof z.ZodError) {
            return NextResponse.json({ 
                error: 'Invalid request data', 
                details: error.errors 
            }, { status: 400 });
        }

        return NextResponse.json({ 
            error: 'Failed to reschedule service' 
        }, { status: 500 });
    }
}

export async function OPTIONS(request) {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
}
