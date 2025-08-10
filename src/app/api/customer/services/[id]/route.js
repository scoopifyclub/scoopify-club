var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { validateUser } from '@/lib/api-auth';
import { cookies } from 'next/headers';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function GET(request, { params }) {
    var _a;
    try {
        // Verify customer authorization
        const cookieStore = await cookies();
        const token = (_a = cookieStore.get('accessToken')) === null || _a === void 0 ? void 0 : _a.value;
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { userId } = await validateUser(token, 'CUSTOMER');
        const { id } = await params;
        // Get the service with all related data
        const service = await prisma.service.findUnique({
            where: { id: serviceId },
            include: {
                customer: {
                    select: {
                        userId: true
                    }
                },
                employee: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                email: true,
                                image: true
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
                },
                location: true,
                serviceArea: true,
                checklist: true,
                delays: true,
                timeExtensions: true,
                photos: {
                    orderBy: {
                        createdAt: 'asc'
                    }
                },
                payments: {
                    select: {
                        amount: true,
                        status: true,
                        createdAt: true
                    }
                }
            }
        });
        if (!service) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 });
        }
        // Verify ownership
        if (service.customer.userId !== userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Remove sensitive data before sending response
        const { customer } = service, serviceWithoutCustomer = __rest(service, ["customer"]);
        return NextResponse.json(serviceWithoutCustomer);
    }
    catch (error) {
        console.error('Error fetching service details:', error);
        return NextResponse.json({ error: 'Failed to fetch service details' }, { status: 500 });
    }
}
export async function POST(request, { params }) {
    var _a;
    try {
        // Verify customer authorization
        const cookieStore = await cookies();
        const token = (_a = cookieStore.get('accessToken')) === null || _a === void 0 ? void 0 : _a.value;
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { userId } = await validateUser(token, 'CUSTOMER');
        const { id } = await params;
        const { rating, comment } = await request.json();
        // Validate feedback data
        if (!rating || rating < 1 || rating > 5) {
            return NextResponse.json({ error: 'Invalid rating. Must be between 1 and 5' }, { status: 400 });
        }
        // Verify service ownership
        const service = await prisma.service.findUnique({
            where: { id: serviceId },
            select: {
                customer: {
                    select: {
                        userId: true
                    }
                }
            }
        });
        if (!service) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 });
        }
        if (service.customer.userId !== userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Create feedback
        const feedback = await prisma.serviceFeedback.create({
            data: {
                serviceId: serviceId,
                rating,
                comment
            }
        });
        return NextResponse.json(feedback);
    }
    catch (error) {
        console.error('Error submitting feedback:', error);
        return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
    }
}
