import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';


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

        const { id } = await request.json();

        // Update service with employee
        const service = await prisma.service.update({
            where: { id: serviceId },
            data: {
                employeeId: decoded.employeeId,
                status: 'ASSIGNED'
            },
            include: {
                customer: {
                    include: {
                        user: true
                    }
                }
            }
        });

        // Send email notification
        if (service.customer?.user?.email) {
            await sendServiceNotificationEmail(
                service.customer.user.email,
                serviceId,
                'claimed',
                {
                    date: service.scheduledDate,
                    address: service.customer.address,
                    employeeName: decoded.name
                }
            );
        }

        return NextResponse.json({ success: true, service });
    } catch (error) {
        console.error('Error claiming service:', error);
        return NextResponse.json({ error: 'Failed to claim service' }, { status: 500 });
    }
}
