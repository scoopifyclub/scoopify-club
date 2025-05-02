import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { validateUser } from '@/lib/api-auth';
import { cookies } from 'next/headers';
export async function GET(request) {
    var _a;
    try {
        // Get access token from cookies
        const cookieStore = await cookies();
        const accessToken = (_a = cookieStore.get('accessToken')) === null || _a === void 0 ? void 0 : _a.value;
        if (!accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Validate the token and check admin role
        const { role } = await validateUser(accessToken, 'ADMIN');
        if (role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Get query parameters for filtering
        const url = new URL(request.url);
        const type = url.searchParams.get('type');
        const status = url.searchParams.get('status');
        // Build query filters
        const filters = {};
        if (type)
            filters.type = type;
        if (status)
            filters.status = status;
        const payments = await prisma.payment.findMany({
            where: filters,
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
                },
                service: {
                    select: {
                        id: true,
                        scheduledDate: true,
                        customer: {
                            select: {
                                user: {
                                    select: {
                                        name: true,
                                    }
                                }
                            },
                        },
                    },
                },
                referredBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        // Transform the data to match the frontend interface
        const formattedPayments = payments.map(payment => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
            return ({
                id: payment.id,
                employeeId: payment.employeeId,
                employeeName: ((_b = (_a = payment.employee) === null || _a === void 0 ? void 0 : _a.user) === null || _b === void 0 ? void 0 : _b.name) || 'N/A',
                customerId: payment.customerId,
                customerName: ((_d = (_c = payment.customer) === null || _c === void 0 ? void 0 : _c.user) === null || _d === void 0 ? void 0 : _d.name) || ((_g = (_f = (_e = payment.service) === null || _e === void 0 ? void 0 : _e.customer) === null || _f === void 0 ? void 0 : _f.user) === null || _g === void 0 ? void 0 : _g.name) || 'N/A',
                referralId: payment.referredId,
                referrerName: ((_h = payment.referredBy) === null || _h === void 0 ? void 0 : _h.name) || 'N/A',
                amount: payment.amount,
                stripeFee: payment.stripeFee || 0,
                netAmount: payment.netAmount || payment.amount,
                status: payment.status,
                type: payment.type,
                paymentMethod: payment.paymentMethod,
                preferredPaymentMethod: ((_j = payment.employee) === null || _j === void 0 ? void 0 : _j.preferredPaymentMethod) || null,
                notes: payment.notes,
                paidAt: payment.paidAt,
                serviceId: payment.serviceId,
                serviceDate: (_k = payment.service) === null || _k === void 0 ? void 0 : _k.scheduledDate,
                createdAt: payment.createdAt
            });
        });
        return NextResponse.json(formattedPayments);
    }
    catch (error) {
        console.error('Error fetching payments:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
export async function POST(request) {
    var _a;
    try {
        // Get access token from cookies
        const cookieStore = await cookies();
        const accessToken = (_a = cookieStore.get('accessToken')) === null || _a === void 0 ? void 0 : _a.value;
        if (!accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Validate the token and check admin role
        const { role } = await validateUser(accessToken, 'ADMIN');
        if (role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { employeeId, amount, paymentMethod } = await request.json();
        const payment = await prisma.payment.create({
            data: {
                employeeId,
                amount,
                paymentMethod,
                status: 'PENDING',
                type: 'EARNINGS',
                createdAt: new Date()
            },
        });
        return NextResponse.json(payment);
    }
    catch (error) {
        console.error('Error creating payment:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
// Batch approve payments - useful for weekly payment processing
export async function PUT(request) {
    var _a;
    try {
        // Get access token from cookies
        const cookieStore = await cookies();
        const accessToken = (_a = cookieStore.get('accessToken')) === null || _a === void 0 ? void 0 : _a.value;
        if (!accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Validate the token and check admin role
        const { userId, role } = await validateUser(accessToken, 'ADMIN');
        if (role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { paymentIds, paymentMethod } = await request.json();
        if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0) {
            return NextResponse.json({ error: 'Invalid request: paymentIds must be a non-empty array' }, { status: 400 });
        }
        // Use transaction to ensure all updates succeed or fail together
        const results = await prisma.$transaction(async (tx) => {
            const updates = [];
            for (const paymentId of paymentIds) {
                const payment = await tx.payment.findUnique({
                    where: { id: paymentId }
                });
                if (!payment || payment.status !== 'PENDING') {
                    continue; // Skip invalid or non-pending payments
                }
                const update = await tx.payment.update({
                    where: { id: paymentId },
                    data: {
                        status: 'APPROVED',
                        paymentMethod: paymentMethod || 'CASH_APP',
                        approvedAt: new Date(),
                        approvedBy: userId
                    }
                });
                updates.push(update);
                // If this is a service payment, update the service status
                if (payment.serviceId) {
                    await tx.service.update({
                        where: { id: payment.serviceId },
                        data: {
                            paymentStatus: 'APPROVED',
                            paymentApprovedAt: new Date(),
                            paymentApprovedBy: userId
                        }
                    });
                }
            }
            return updates;
        });
        return NextResponse.json({
            message: `Successfully approved ${results.length} payments`,
            results
        });
    }
    catch (error) {
        console.error('Error batch approving payments:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
