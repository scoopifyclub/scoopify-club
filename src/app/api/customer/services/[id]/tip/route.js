import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { validateUserToken } from '@/lib/jwt-utils';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { sendTipNotification } from '@/lib/unified-email-service';

export const runtime = 'nodejs';

// Validation schema for tip request
const tipSchema = z.object({
    amount: z.number().min(1).max(100), // $1 to $100 tip limit
    message: z.string().max(200).optional(), // Optional thank you message
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
                },
                status: 'COMPLETED',
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
                                email: true
                            }
                        }
                    }
                },
                customer: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                email: true
                            }
                        }
                    }
                }
            }
        });

        if (!service) {
            return NextResponse.json({
                error: 'Service not found, not completed, or not assigned to an employee'
            }, { status: 404 });
        }

        // Check if tip already exists for this service
        const existingTip = await prisma.tip.findFirst({
            where: { serviceId }
        });

        if (existingTip) {
            return NextResponse.json({
                error: 'Tip already provided for this service'
            }, { status: 400 });
        }

        // Parse request body
        const body = await request.json();
        const validatedData = tipSchema.parse(body);

        // Calculate processing fee (2.9% + $0.30 like Stripe)
        const processingFee = (validatedData.amount * 0.029) + 0.30;
        const netAmount = validatedData.amount - processingFee;

        // Use a transaction to create the tip and send notification
        const result = await prisma.$transaction(async (tx) => {
            // Create the tip record
            const tip = await tx.tip.create({
                data: {
                    id: `tip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    serviceId: service.id,
                    customerId: service.customerId,
                    employeeId: service.employeeId,
                    amount: validatedData.amount,
                    processingFee: processingFee,
                    netAmount: netAmount,
                    message: validatedData.message,
                    status: 'PENDING',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });

            // Update employee's total tips
            await tx.employee.update({
                where: { id: service.employeeId },
                data: {
                    totalTips: {
                        increment: netAmount
                    }
                }
            });

            return tip;
        });

        // Send notification to employee about the tip
        let emailResult = null;
        try {
            emailResult = await sendTipNotification(service, result, validatedData);
        } catch (emailError) {
            console.error('Email notification failed:', emailError);
            // Don't fail the entire request if email fails
            emailResult = { success: false, error: emailError.message };
        }

        return NextResponse.json({
            success: true,
            message: 'Tip sent successfully!',
            tip: result,
            processingFee: processingFee,
            netAmount: netAmount,
            emailSent: emailResult?.success || false,
            emailError: emailResult?.error || null
        });

    } catch (error) {
        console.error('Tip creation error:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json({
                error: 'Invalid tip amount or message',
                details: error.errors
            }, { status: 400 });
        }

        return NextResponse.json({
            error: 'Failed to send tip'
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
