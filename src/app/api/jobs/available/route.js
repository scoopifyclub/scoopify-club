import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireScooper, releaseExpiredClaims, UNCLAIMED_JOB_CUSTOMER_SELECT, toUnclaimedCustomerView } from '@/lib/job-claims';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';


export async function GET(request) {
    try {
        const auth = await requireScooper(request);
        if (!auth.ok) return auth.response;

        await releaseExpiredClaims();

        // Get employee's service areas
        const employee = await prisma.employee.findUnique({
            where: { id: auth.employee.id },
            include: { serviceAreas: { where: { active: true } } }
        });

        if (!employee) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }

        // Get available jobs in employee's service areas
        const availableJobs = await prisma.service.findMany({
            where: {
                status: 'SCHEDULED',
                employeeId: null,
                customer: {
                    address: {
                        zipCode: {
                            in: employee.serviceAreas.map(area => area.zipCode)
                        }
                    }
                }
            },
            include: {
                customer: UNCLAIMED_JOB_CUSTOMER_SELECT,
                servicePlan: true
            },
            orderBy: {
                scheduledDate: 'asc'
            }
        });

        return NextResponse.json({ 
            success: true, 
            jobs: availableJobs.map(job => ({
                id: job.id,
                scheduledDate: job.scheduledDate,
                customerName: toUnclaimedCustomerView(job.customer).name,
                address: toUnclaimedCustomerView(job.customer).address,
                servicePlan: job.servicePlan.name,
                potentialEarnings: job.potentialEarnings
            }))
        });
    } catch (error) {
        console.error('Error fetching available jobs:', error);
        return NextResponse.json({ error: 'Failed to fetch available jobs' }, { status: 500 });
    }
} 