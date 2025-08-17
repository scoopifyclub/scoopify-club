import { NextResponse } from 'next/server';
import { validateUserToken } from '@/lib/jwt-utils';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

// Validation schema for feedback
const feedbackSchema = z.object({
    rating: z.number().min(1).max(5),
    comment: z.string().optional(),
    categories: z.array(z.string()).optional()
});

export async function POST(request, { params }) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('accessToken')?.value || 
                     cookieStore.get('token')?.value || 
                     cookieStore.get('refreshToken')?.value;
        
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized - No token' }, { status: 401 });
        }
        
        const decoded = await validateUserToken(token);
        if (!decoded || decoded.role !== 'CUSTOMER') {
            return NextResponse.json({ error: 'Unauthorized - Not customer' }, { status: 401 });
        }

        const { id: serviceId } = params;
        if (!serviceId) {
            return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
        }

        // Get customer record
        const customer = await prisma.customer.findFirst({
            where: { userId: decoded.userId }
        });

        if (!customer) {
            return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
        }

        // Verify the service belongs to this customer
        const service = await prisma.service.findUnique({
            where: {
                id: serviceId,
                customerId: customer.id
            },
            include: {
                employee: {
                    include: {
                        user: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        });

        if (!service) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 });
        }

        // Check if service is completed
        if (service.status !== 'COMPLETED') {
            return NextResponse.json({ error: 'Can only provide feedback for completed services' }, { status: 400 });
        }

        // Check if already rated
        if (service.rated) {
            return NextResponse.json({ error: 'Service has already been rated' }, { status: 400 });
        }

        // Parse and validate request body
        const body = await request.json();
        const validatedData = feedbackSchema.parse(body);

        // Create feedback record
        const feedback = await prisma.serviceFeedback.create({
            data: {
                serviceId: serviceId,
                customerId: customer.id,
                employeeId: service.employeeId,
                rating: validatedData.rating,
                comment: validatedData.comment,
                categories: validatedData.categories || [],
                createdAt: new Date()
            }
        });

        // Update service to mark as rated
        await prisma.service.update({
            where: { id: serviceId },
            data: { rated: true }
        });

        // Update employee rating if employee exists
        if (service.employeeId) {
            // Get current employee rating stats
            const employeeStats = await prisma.serviceFeedback.aggregate({
                where: { employeeId: service.employeeId },
                _avg: { rating: true },
                _count: { rating: true }
            });

            // Update employee average rating
            await prisma.employee.update({
                where: { id: service.employeeId },
                data: {
                    averageRating: employeeStats._avg.rating || 0,
                    completedJobs: employeeStats._count.rating || 0
                }
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Feedback submitted successfully',
            feedback: {
                id: feedback.id,
                rating: feedback.rating,
                comment: feedback.comment,
                categories: feedback.categories,
                createdAt: feedback.createdAt
            }
        });

    } catch (error) {
        console.error('Error submitting feedback:', error);
        
        if (error instanceof z.ZodError) {
            return NextResponse.json({ 
                error: 'Invalid feedback data', 
                details: error.errors 
            }, { status: 400 });
        }
        
        return NextResponse.json({ 
            error: 'Failed to submit feedback',
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
