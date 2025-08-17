import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { validateUserToken } from '@/lib/jwt-utils';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { 
    sendScooperArrivedNotification, 
    sendServiceCompletedNotification 
} from '@/lib/unified-email-service';

export const runtime = 'nodejs';

// Validation schema for status updates
const statusUpdateSchema = z.object({
    status: z.enum(['ARRIVED', 'IN_PROGRESS', 'COMPLETED']),
    notes: z.string().optional(),
    beforePhotoIds: z.array(z.string()).optional(),
    afterPhotoIds: z.array(z.string()).optional(),
    gatePhotoId: z.string().optional(),
    checklistCompleted: z.boolean().optional(),
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

        const { userId } = await validateUserToken(token, 'EMPLOYEE');
        
        // Get the service and validate employee ownership
        const service = await prisma.service.findFirst({
            where: {
                id: serviceId,
                employeeId: {
                    not: null
                }
            },
            include: {
                employee: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                image: true
                            }
                        }
                    }
                },
                customer: {
                    include: {
                        user: {
                            select: {
                                email: true,
                                name: true
                            }
                        }
                    }
                },
                servicePlan: {
                    select: {
                        name: true,
                        price: true
                    }
                }
            }
        });

        if (!service) {
            return NextResponse.json({ error: 'Service not found or not assigned' }, { status: 404 });
        }

        // Verify the employee is assigned to this service
        if (service.employee.userId !== userId) {
            return NextResponse.json({ error: 'Not authorized to update this service' }, { status: 403 });
        }

        // Parse request body
        const body = await request.json();
        const validatedData = statusUpdateSchema.parse(body);
        
        // Prepare update data
        const updateData = {
            status: validatedData.status,
            updatedAt: new Date(),
            ...(validatedData.notes && { notes: validatedData.notes }),
            ...(validatedData.checklistCompleted !== undefined && { checklistCompleted: validatedData.checklistCompleted })
        };

        // Handle status-specific updates
        if (validatedData.status === 'ARRIVED') {
            updateData.arrivedAt = new Date();
        } else if (validatedData.status === 'COMPLETED') {
            updateData.completedDate = new Date();
            updateData.workflowStatus = 'COMPLETED';
        }

        // Handle photo uploads if provided
        if (validatedData.beforePhotoIds && validatedData.beforePhotoIds.length > 0) {
            updateData.beforePhotoIds = validatedData.beforePhotoIds;
        }
        if (validatedData.afterPhotoIds && validatedData.afterPhotoIds.length > 0) {
            updateData.afterPhotoIds = validatedData.afterPhotoIds;
        }
        if (validatedData.gatePhotoId) {
            updateData.gatePhotoId = validatedData.gatePhotoId;
        }

        // Update the service
        const updatedService = await prisma.service.update({
            where: { id: serviceId },
            data: updateData,
            include: {
                employee: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                image: true
                            }
                        }
                    }
                },
                customer: {
                    include: {
                        user: {
                            select: {
                                email: true,
                                name: true
                            }
                        }
                    }
                },
                servicePlan: {
                    select: {
                        name: true,
                        price: true
                    }
                }
            }
        });

        // Send notification to customer based on status
        let emailResult = null;
        try {
            // Import and use our new unified email service
            const { sendScooperArrivedEmail, sendServiceCompletedEmail } = await import('@/lib/unified-email-service');
            
            if (validatedData.status === 'ARRIVED') {
                emailResult = await sendScooperArrivedEmail(updatedService, updatedService.employee);
            } else if (validatedData.status === 'COMPLETED') {
                emailResult = await sendServiceCompletedEmail(updatedService, updatedService.employee);
            }
        } catch (emailError) {
            console.error('Email notification failed:', emailError);
            // Don't fail the entire request if email fails
            emailResult = { success: false, error: emailError.message };
        }

        return NextResponse.json({
            success: true,
            message: `Service status updated to ${validatedData.status}`,
            service: updatedService,
            emailSent: emailResult?.success || false,
            emailError: emailResult?.error || null
        });

    } catch (error) {
        console.error('Service status update error:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json({
                error: 'Invalid request data',
                details: error.errors
            }, { status: 400 });
        }

        return NextResponse.json({
            error: 'Failed to update service status'
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
