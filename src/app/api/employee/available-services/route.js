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

        // Get employee with their current active service and rating
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
                            in: ['IN_PROGRESS'] // Use correct enum value
                        }
                    }
                },
                serviceAreas: true
            }
        });

        if (!employee) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }

        // Check if employee has an active service (currently working on a job)
        const hasActiveService = employee.services.length > 0;

        // Get employee's average rating
        const employeeRating = employee.averageRating || 0;
        const canQueueJobs = employeeRating >= 4.5;

        // If employee has an active service and can't queue, return empty list
        if (hasActiveService && !canQueueJobs) {
            return NextResponse.json({
                services: [],
                message: "You have an active service. Complete it before claiming another. (Rating-based queuing requires 4.5+ stars)"
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
            // Calculate distance for each service
            sortedServices = services.map(service => {
                const customerAddress = service.customer.address;
                if (customerAddress?.latitude && customerAddress?.longitude) {
                    const distance = calculateDistance(
                        latitude, 
                        longitude, 
                        customerAddress.latitude, 
                        customerAddress.longitude
                    );
                    return { ...service, distance };
                }
                return { ...service, distance: 9999 }; // Large distance for unknown locations
            });

            // Sort by distance (closest first)
            sortedServices.sort((a, b) => a.distance - b.distance);
        }

        // Limit to closest 10 jobs
        const closestJobs = sortedServices.slice(0, 10);

        // Add employee status information
        const response = {
            services: closestJobs,
            message: `Found ${closestJobs.length} available jobs (showing closest 10)`,
            unlockTime: eightAM.toISOString(),
            currentTime: now.toISOString(),
            employeeStatus: {
                hasActiveService,
                canQueueJobs,
                averageRating: employeeRating,
                activeServiceCount: employee.services.length
            }
        };

        // Add queuing information if applicable
        if (hasActiveService && canQueueJobs) {
            response.message += " - You can queue additional jobs (4.5+ star rating)";
        } else if (hasActiveService && !canQueueJobs) {
            response.message = "Complete your active service before claiming another job";
        }

        return NextResponse.json(response);

    } catch (error) {
        console.error('Error fetching available services:', error);
        return NextResponse.json({ error: 'Failed to fetch available services' }, { status: 500 });
    }
}
