import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(request) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        if (!decoded || decoded.role !== 'EMPLOYEE') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { jobId } = await request.json();

        // Verify employee and job exist
        const employee = await prisma.employee.findUnique({
            where: { userId: decoded.id },
            include: { serviceAreas: true }
        });

        if (!employee) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }

        const job = await prisma.service.findUnique({
            where: { id: jobId },
            include: { serviceArea: true }
        });

        if (!job) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }

        // Verify job is available
        if (job.status !== 'SCHEDULED' || job.employeeId) {
            return NextResponse.json({ error: 'Job is not available' }, { status: 400 });
        }

        // Verify service area
        const canService = employee.serviceAreas.some(area => area.zipCode === job.serviceArea?.zipCode);
        if (!canService) {
            return NextResponse.json({ error: 'Job is not in your service area' }, { status: 400 });
        }

        // Update job with employee
        const updatedJob = await prisma.service.update({
            where: { id: jobId },
            data: {
                employeeId: employee.id,
                status: 'ASSIGNED'
            },
            include: {
                customer: {
                    include: { user: true }
                }
            }
        });

        return NextResponse.json({ success: true, job: updatedJob });
    } catch (error) {
        console.error('Error claiming job:', error);
        return NextResponse.json({ error: 'Failed to claim job' }, { status: 500 });
    }
} 