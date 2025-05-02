import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { verifyToken } from '@/lib/api-auth';
export async function POST(request, { params }) {
    var _a;
    try {
        const token = (_a = request.headers.get('authorization')) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const decoded = verifyToken(token);
        if (!decoded || decoded.role !== 'EMPLOYEE') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const service = await prisma.service.findUnique({
            where: { id: (await params).serviceId },
            include: { employee: true }
        });
        if (!service) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 });
        }
        if (service.employeeId !== decoded.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const checklist = await request.json();
        const serviceChecklist = await prisma.serviceChecklist.create({
            data: Object.assign({ serviceId: (await params).serviceId }, checklist)
        });
        return NextResponse.json(serviceChecklist);
    }
    catch (error) {
        console.error('Error creating checklist:', error);
        return NextResponse.json({ error: 'Failed to create checklist' }, { status: 500 });
    }
}
export async function GET(request, { params }) {
    var _a;
    try {
        const token = (_a = request.headers.get('authorization')) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const service = await prisma.service.findUnique({
            where: { id: (await params).serviceId },
            include: { checklist: true }
        });
        if (!service) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 });
        }
        // Only allow access to checklist if user is the customer or employee
        if (decoded.role === 'CUSTOMER' && service.customerId !== decoded.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (decoded.role === 'EMPLOYEE' && service.employeeId !== decoded.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json(service.checklist);
    }
    catch (error) {
        console.error('Error fetching checklist:', error);
        return NextResponse.json({ error: 'Failed to fetch checklist' }, { status: 500 });
    }
}
