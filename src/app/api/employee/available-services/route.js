import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { verifyToken } from '@/lib/api-auth';
import { startOfDay, endOfDay, setHours, format, isAfter, isBefore } from 'date-fns';
import { calculateDistance } from '@/lib/geolocation';

export async function GET(request) {
    try {
        // Extract token for authorization
        const token = request.headers.get('Authorization')?.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const decoded = await verifyToken(token);
        if (!decoded || decoded.role !== 'EMPLOYEE') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get employee location from query params if available
        const url = new URL(request.url);
        const latitude = parseFloat(url.searchParams.get('latitude') || '0');
        const longitude = parseFloat(url.searchParams.get('longitude') || '0');
        const hasLocation = latitude !== 0 && longitude !== 0;

        // Get current date and set time boundaries
        const today = new Date();
        const now = new Date();
        const eightAM = setHours(startOfDay(today), 8); // 8 AM today
        const sevenPM = setHours(startOfDay(today), 19); // 7 PM today

        // Check if current time is before 8 AM
        if (isBefore(now, eightAM)) {
            const timeUntilUnlock = eightAM.getTime() - now.getTime();
            const minutesUntilUnlock = Math.ceil(timeUntilUnlock / (1000 * 60));
            
            return NextResponse.json({
                services: [],
                message: `Jobs unlock at 8:00 AM (${minutesUntilUnlock} minutes remaining)`,
                unlockTime: eightAM.toISOString(),
                timeUntilUnlock: minutesUntilUnlock
            });
        }

        // Check if current time is after 7 PM
        if (isAfter(now, sevenPM)) {
            return NextResponse.json({
                services: [],
                message: "Services are only available between 8:00 AM and 7:00 PM"
            });
        }

        // Get the current day of the week
        const currentDayOfWeek = format(today, 'EEEE');

        // Check if employee already has a claimed service for today
        const employee = await prisma.employee.findUnique({
            where: { userId: decoded.userId },
            include: {
                services: {
                    where: {
                        scheduledDate: {
                            gte: startOfDay(today),
                            lt: endOfDay(today)
                        },
                        status: {
                            in: ['ASSIGNED', 'IN_PROGRESS']
                        }
                    }
                },
                serviceAreas: true
            }
        });

        if (!employee) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }

        // If employee already has a claimed service for today, return empty list
        if (employee.services.length > 0) {
            return NextResponse.json({
                services: [],
                message: "You already have an active service. Complete it before claiming another."
            });
        }

        // Only show services that are:
        // 1. SCHEDULED status
        // 2. Not claimed by any employee
        // 3. Unlocked (isLocked: false)
        // 4. Scheduled for today between 8 AM and 7 PM
        // 5. Match the customer's preferred service day
        // 6. In employee's service areas
        const services = await prisma.service.findMany({
            where: {
                status: 'SCHEDULED',
                employeeId: null,
                isLocked: false, // Only show unlocked jobs
                scheduledDate: {
                    gte: eightAM,
                    lte: sevenPM
                },
                customer: {
                    serviceDay: currentDayOfWeek
                },
                address: {
                    zipCode: {
                        in: employee.serviceAreas.map(area => area.zipCode)
                    }
                }
            },
            include: {
                customer: {
                    select: {
                        name: true,
                        phone: true,
                        address: true,
                        gateCode: true,
                        serviceDay: true
                    }
                },
                servicePlan: true
            }
        });

        // Sort services by proximity if location is provided
        let sortedServices = [...services];
        if (hasLocation) {
            sortedServices.sort((a, b) => {
                const distanceA = calculateDistance(
                    latitude, longitude,
                    a.customer.address.latitude || 0,
                    a.customer.address.longitude || 0
                );
                const distanceB = calculateDistance(
                    latitude, longitude,
                    b.customer.address.latitude || 0,
                    b.customer.address.longitude || 0
                );
                return distanceA - distanceB;
            });
        }

        // Add distance information if location is available
        if (hasLocation) {
            sortedServices = sortedServices.map(service => ({
                ...service,
                distance: calculateDistance(
                    latitude, longitude,
                    service.customer.address.latitude || 0,
                    service.customer.address.longitude || 0
                )
            }));
        }

        return NextResponse.json({
            services: sortedServices,
            message: `Found ${sortedServices.length} available jobs`,
            unlockTime: eightAM.toISOString(),
            currentTime: now.toISOString()
        });

    } catch (error) {
        console.error('Error fetching available services:', error);
        return NextResponse.json({ error: 'Failed to fetch available services' }, { status: 500 });
    }
}
