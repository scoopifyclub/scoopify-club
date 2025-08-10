import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { validateUser } from '@/lib/api-auth';
import { cookies } from 'next/headers';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function GET(request, { params }) {
    var _a, _b, _c, _d;
    try {
        // Get access token from cookies
        const cookieStore = await cookies();
        const accessToken = (_a = cookieStore.get('accessToken')) === null || _a === void 0 ? void 0 : _a.value;
        if (!accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Validate the token
        const userData = await validateUser(accessToken);
        const { customerId } = await params;
        // Check if user is allowed to access this customer's data
        if (userData.role !== 'ADMIN' &&
            (userData.role !== 'CUSTOMER' || userData.customerId !== customerId)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Get customer preferences
        const customer = await prisma.customer.findUnique({
            where: { id: customerId },
            select: {
                id: true,
                serviceDay: true,
                serviceFrequency: true,
                serviceTime: true,
                preferredEmployeeId: true,
                specialInstructions: true,
                allowUnattendedService: true,
                notificationPreferences: true
            }
        });
        if (!customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }
        // Get preferred employee details if set
        let preferredEmployee = null;
        if (customer.preferredEmployeeId) {
            preferredEmployee = await prisma.employee.findUnique({
                where: { id: customer.preferredEmployeeId },
                select: {
                    id: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            image: true
                        }
                    }
                }
            });
        }
        return NextResponse.json(Object.assign(Object.assign({}, customer), { preferredEmployee: preferredEmployee ? {
                id: preferredEmployee.id,
                name: (_b = preferredEmployee.user) === null || _b === void 0 ? void 0 : _b.name,
                email: (_c = preferredEmployee.user) === null || _c === void 0 ? void 0 : _c.email,
                image: (_d = preferredEmployee.user) === null || _d === void 0 ? void 0 : _d.image
            } : null }));
    }
    catch (error) {
        console.error('Error fetching customer preferences:', error);
        return NextResponse.json({ error: 'Failed to fetch customer preferences' }, { status: 500 });
    }
}
export async function PUT(request, { params }) {
    var _a;
    try {
        // Get access token from cookies
        const cookieStore = await cookies();
        const accessToken = (_a = cookieStore.get('accessToken')) === null || _a === void 0 ? void 0 : _a.value;
        if (!accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Validate the token
        const userData = await validateUser(accessToken);
        const { customerId } = await params;
        // Check if user is allowed to access this customer's data
        if (userData.role !== 'ADMIN' &&
            (userData.role !== 'CUSTOMER' || userData.customerId !== customerId)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Get the request body
        const data = await request.json();
        // Update only allowed fields
        const allowedFields = [
            'serviceDay',
            'serviceFrequency',
            'serviceTime',
            'preferredEmployeeId',
            'specialInstructions',
            'allowUnattendedService',
            'notificationPreferences'
        ];
        const updateData = {};
        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                updateData[field] = data[field];
            }
        }
        // Validate preferred employee ID if present
        if (updateData['preferredEmployeeId']) {
            const employee = await prisma.employee.findUnique({
                where: { id: updateData['preferredEmployeeId'] }
            });
            if (!employee) {
                return NextResponse.json({ error: 'Selected employee not found' }, { status: 400 });
            }
        }
        // Update customer preferences
        const updatedCustomer = await prisma.customer.update({
            where: { id: customerId },
            data: updateData,
            select: {
                id: true,
                serviceDay: true,
                serviceFrequency: true,
                serviceTime: true,
                preferredEmployeeId: true,
                specialInstructions: true,
                allowUnattendedService: true,
                notificationPreferences: true
            }
        });
        return NextResponse.json(updatedCustomer);
    }
    catch (error) {
        console.error('Error updating customer preferences:', error);
        return NextResponse.json({ error: 'Failed to update customer preferences' }, { status: 500 });
    }
}
