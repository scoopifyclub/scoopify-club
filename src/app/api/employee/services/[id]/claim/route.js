import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { validateUserToken } from '@/lib/jwt-utils';
import { cookies } from 'next/headers';
import { sendServiceClaimedNotification } from '@/lib/unified-email-service';

export const runtime = 'nodejs';

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

        // Get the employee
        const employee = await prisma.employee.findFirst({
            where: { userId },
            include: {
                user: {
                    select: {
                        name: true,
                        image: true
                    }
                }
            }
        });

        if (!employee) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }

        // Get the service and check if it's available
        const service = await prisma.service.findFirst({
            where: {
                id: serviceId,
                status: 'SCHEDULED',
                employeeId: null, // Not already claimed
                isLocked: false // Not locked by another employee
            },
            include: {
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
                        price: true,
                        duration: true
                    }
                }
            }
        });

        if (!service) {
            return NextResponse.json({
                error: 'Service not available for claiming'
            }, { status: 400 });
        }

        // Check if employee has set their service area
        if (!employee.hasSetServiceArea) {
            return NextResponse.json({
                error: 'You must set your service area before claiming jobs'
            }, { status: 400 });
        }

        // Use a transaction to claim the service and send notification
        const result = await prisma.$transaction(async (tx) => {
            // Claim the service
            const claimedService = await tx.service.update({
                where: { id: serviceId },
                data: {
                    employeeId: employee.id,
                    claimedAt: new Date(),
                    status: 'PENDING',
                    workflowStatus: 'CLAIMED',
                    updatedAt: new Date()
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
                            price: true,
                            duration: true
                        }
                    }
                }
            });

            return claimedService;
        });

        // Send notification to customer that job has been claimed
        let emailResult = null;
        try {
            // Import and use our new unified email service
            const { sendServiceClaimedEmail } = await import('@/lib/unified-email-service');
            emailResult = await sendServiceClaimedEmail(result, result.employee);
        } catch (emailError) {
            console.error('Email notification failed:', emailError);
            // Don't fail the entire request if email fails
            emailResult = { success: false, error: emailError.message };
        }

        return NextResponse.json({
            success: true,
            message: 'Service claimed successfully!',
            service: result,
            emailSent: emailResult?.success || false,
            emailError: emailResult?.error || null
        });

    } catch (error) {
        console.error('Service claim error:', error);
        return NextResponse.json({
            error: 'Failed to claim service'
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
