import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { verifyToken } from '@/lib/auth';

export async function GET(request) {
    try {
        // Verify employee authorization
        const token = request.headers.get('Authorization')?.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const decoded = await verifyToken(token);
        if (!decoded || decoded.role !== 'EMPLOYEE') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Get employee's service areas
        const employee = await prisma.employee.findUnique({
            where: { userId: decoded.userId || decoded.id },
            include: {
                serviceAreas: true
            }
        });
        if (!employee) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }
        // Get all unclaimed services in employee's service areas
        const availableServices = await prisma.service.findMany({
            where: {
                status: 'SCHEDULED',
                employeeId: null, // Only unclaimed services
                address: {
                    zipCode: {
                        in: employee.serviceAreas.map(area => area.zipCode)
                    }
                },
                scheduledFor: {
                    gte: new Date() // Only future services
                }
            },
            include: {
                address: true
            },
            orderBy: {
                scheduledFor: 'asc'
            }
        });
        // Calculate payment for each service
        const servicesWithPayment = availableServices.map(service => {
            // Base payment calculation
            let payment = 25; // Base rate for one-time service
            // Adjust based on service type
            if (service.type === 'regular') {
                payment = 20; // Lower rate for regular services
            }
            else if (service.type === 'extra') {
                payment = 30; // Higher rate for extra services
            }
            // Add per dog fee
            payment += (service.numberOfDogs - 1) * 5; // $5 extra per additional dog
            // Estimate duration based on number of dogs and service type
            const estimatedDuration = service.type === 'one-time'
                ? 45 + (service.numberOfDogs - 1) * 15 // Base 45 mins + 15 mins per additional dog
                : 30 + (service.numberOfDogs - 1) * 10; // Base 30 mins + 10 mins per additional dog
            return {
                id: service.id,
                scheduledFor: service.scheduledFor,
                type: service.type,
                numberOfDogs: service.numberOfDogs,
                estimatedDuration,
                payment,
                address: {
                    street: service.address.street,
                    city: service.address.city,
                    state: service.address.state,
                    zipCode: service.address.zipCode,
                    latitude: service.address.latitude,
                    longitude: service.address.longitude
                }
            };
        });
        return NextResponse.json(servicesWithPayment);
    }
    catch (error) {
        console.error('Error fetching available jobs:', error);
        return NextResponse.json({ error: 'Failed to fetch available jobs' }, { status: 500 });
    }
}
