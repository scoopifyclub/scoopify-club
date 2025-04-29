import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { jobId } = await request.json();
        if (!jobId) {
            return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
        }

        // Get the employee ID from the session user
        const employee = await prisma.employee.findUnique({
            where: { userId: session.user.id },
        });

        if (!employee) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }

        // Start a transaction to ensure atomicity
        const updatedJob = await prisma.$transaction(async (tx) => {
            // Check if job is still available
            const job = await tx.job.findUnique({
                where: { id: jobId },
            });

            if (!job) {
                throw new Error('Job not found');
            }

            if (job.status !== 'AVAILABLE') {
                throw new Error('Job is no longer available');
            }

            // Update job status and assign to employee
            return await tx.job.update({
                where: { id: jobId },
                data: {
                    status: 'ASSIGNED',
                    employeeId: employee.id,
                    assignedAt: new Date(),
                },
                include: {
                    client: {
                        select: {
                            name: true,
                            address: true,
                        },
                    },
                },
            });
        });

        return NextResponse.json(updatedJob);
    } catch (error) {
        console.error('Error claiming job:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to claim job' },
            { status: error.message === 'Job not found' ? 404 : 500 }
        );
    }
} 