import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function POST(request) {
    var _a;
    try {
        const auth = await requireAdmin(request);
        if (!auth.ok) return auth.response;
        const { id } = await request.json();
        // Get service details including customer address
        const service = await prisma.service.findUnique({
            where: { id: serviceId },
            include: {
                customer: {
                    include: {
                        address: true,
                        user: true
                    }
                }
            }
        });
        if (!service) {
            return new NextResponse('Service not found', { status: 404 });
        }
        // Check if customer status
        const customer = service.customer;
        if (!customer) {
            return new NextResponse('Customer not found', { status: 404 });
        }
        const customerAddress = customer.address;
        if (!customerAddress) {
            return new NextResponse('Customer address not found', { status: 404 });
        }
        // Get all active employees with their service areas
        const employees = await prisma.employee.findMany({
            where: {
                status: 'ACTIVE',
                serviceAreas: {
                    some: {}
                }
            },
            include: {
                user: true,
                serviceAreas: true
            }
        });
        // Match employees based on distance
        const matchedEmployees = employees
            .map(employee => {
            // Find service area that matches customer zip code or is closest
            const matchingArea = employee.serviceAreas.find(area => area.zipCode === customerAddress.zipCode) || employee.serviceAreas[0];
            if (!matchingArea)
                return null;
            // Calculate approximate distance between zip codes
            // For simplicity, just use a fixed value or dummy calculation
            const distance = Math.abs(parseInt(customerAddress.zipCode) - parseInt(matchingArea.zipCode)) / 1000; // Simplistic distance calculation
            // Use a reasonable default radius if needed
            const serviceRadius = 20; // miles
            if (distance <= serviceRadius) {
                return {
                    id: employee.id,
                    name: employee.user.name,
                    distance,
                    zipCode: matchingArea.zipCode,
                    serviceRadius
                };
            }
            return null;
        })
            .filter(Boolean)
            .sort((a, b) => a.distance - b.distance);
        return NextResponse.json({
            matchedEmployees,
            customerZipCode: customerAddress.zipCode,
            totalMatches: matchedEmployees.length
        });
    }
    catch (error) {
        console.error('Error matching service:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
