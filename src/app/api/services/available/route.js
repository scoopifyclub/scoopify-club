import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { requireScooper, releaseExpiredClaims, UNCLAIMED_JOB_CUSTOMER_SELECT, toUnclaimedCustomerView } from '@/lib/job-claims';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';


export async function GET(request) {
    try {
        const auth = await requireScooper(request);
        if (!auth.ok) return auth.response;

        await releaseExpiredClaims();

        // Get employee details to check service areas
        const employee = await prisma.employee.findUnique({
            where: { id: auth.employee.id },
            include: {
                serviceAreas: { where: { active: true } }
            }
        });

        if (!employee) {
            return NextResponse.json({ error: 'Employee profile not found' }, { status: 404 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const date = searchParams.get('date') ? new Date(searchParams.get('date')) : new Date();

        // Get available services in scooper's service areas
        const availableServices = await prisma.service.findMany({
            where: {
                status: 'SCHEDULED',
                employeeId: null, // Not claimed by any scooper
                scheduledDate: {
                    gte: date, // Only future services
                },
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
            orderBy: [
                { scheduledDate: 'asc' },
                { createdAt: 'asc' }
            ],
            skip: (page - 1) * limit,
            take: limit
        });

        // Get total count for pagination
        const totalCount = await prisma.service.count({
            where: {
                status: 'SCHEDULED',
                employeeId: null,
                scheduledDate: {
                    gte: date,
                },
                customer: {
                    address: {
                        zipCode: {
                            in: employee.serviceAreas.map(area => area.zipCode)
                        }
                    }
                }
            }
        });

        // Format the response
        const formattedServices = availableServices.map(service => ({
            id: service.id,
            scheduledDate: service.scheduledDate,
            potentialEarnings: service.potentialEarnings,
            customerName: toUnclaimedCustomerView(service.customer).name,
            address: toUnclaimedCustomerView(service.customer).address,
            servicePlan: {
                name: service.servicePlan.name,
                duration: service.servicePlan.duration
            }
        }));

        return NextResponse.json({
            services: formattedServices,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                totalItems: totalCount,
                itemsPerPage: limit
            }
        });
    } catch (error) {
        console.error('Error fetching available services:', error);
        return NextResponse.json({ error: 'Failed to fetch available services' }, { status: 500 });
    }
}
