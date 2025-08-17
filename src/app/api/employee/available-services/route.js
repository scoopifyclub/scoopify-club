import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { validateUserToken } from '@/lib/jwt-utils';
import { cookies } from 'next/headers';
import { calculateDistance } from '@/lib/geolocation';
import { setHours, startOfDay, endOfDay, isAfter, isBefore } from 'date-fns';

export const runtime = 'nodejs';

export async function GET(request) {
    try {
        // Get and validate token
        const cookieStore = await cookies();
        const token = cookieStore.get('accessToken')?.value;
        
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userId } = await validateUserToken(token, 'EMPLOYEE');
        
        // Get the employee with their service areas and current services
        const employee = await prisma.employee.findFirst({
            where: { userId },
            include: {
                serviceAreas: true,
                services: {
                    where: {
                        scheduledDate: {
                            gte: startOfDay(new Date()),
                            lt: endOfDay(new Date())
                        },
                        status: {
                            in: ['PENDING', 'IN_PROGRESS']
                        }
                    }
                }
            }
        });

        if (!employee) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }

        // Check if current time is between 8am and 7pm
        const now = new Date();
        const today = new Date();
        const eightAM = setHours(startOfDay(today), 8);
        const sevenPM = setHours(startOfDay(today), 19);
        
        if (isBefore(now, eightAM) || isAfter(now, sevenPM)) {
            return NextResponse.json({ 
                error: 'Services can only be viewed between 8:00 AM and 7:00 PM' 
            }, { status: 400 });
        }

        // Get employee's current location (from last service or service area)
        let employeeLatitude, employeeLongitude;
        const hasLocation = request.nextUrl.searchParams.has('latitude') && request.nextUrl.searchParams.has('longitude');
        
        if (hasLocation) {
            employeeLatitude = parseFloat(request.nextUrl.searchParams.get('latitude'));
            employeeLongitude = parseFloat(request.nextUrl.searchParams.get('longitude'));
        } else {
            // Try to get location from last completed service
            const lastService = await prisma.service.findFirst({
                where: {
                    employeeId: employee.id,
                    status: 'COMPLETED',
                    location: {
                        isNot: null
                    }
                },
                include: {
                    location: true
                },
                orderBy: {
                    completedDate: 'desc'
                }
            });

            if (lastService?.location) {
                employeeLatitude = lastService.location.latitude;
                employeeLongitude = lastService.location.longitude;
            } else if (employee.serviceAreas.length > 0) {
                // Use first service area as approximate location
                // This would need to be enhanced with actual coordinates for service areas
                employeeLatitude = 39.7392; // Default coordinates (would come from service area)
                employeeLongitude = -104.9903;
            }
        }

        // Get employee's service area zip codes
        const employeeZipCodes = employee.serviceAreas.map(area => area.zipCode);

        // Get available services in employee's service areas
        const services = await prisma.service.findMany({
            where: {
                status: 'SCHEDULED',
                employeeId: null,
                customer: {
                    address: {
                        zipCode: {
                            in: employeeZipCodes
                        }
                    }
                }
            },
            include: {
                customer: {
                    include: {
                        user: {
                            select: {
                                name: true
                            }
                        },
                        address: true
                    }
                },
                servicePlan: {
                    select: {
                        name: true,
                        price: true,
                        duration: true
                    }
                }
            },
            orderBy: {
                scheduledDate: 'asc'
            }
        });

        // Calculate distance for each service and add distance information
        let sortedServices = [...services];
        if (employeeLatitude && employeeLongitude) {
            sortedServices = services.map(service => {
                const customerAddress = service.customer.address;
                let distance = null;
                
                if (customerAddress?.latitude && customerAddress?.longitude) {
                    // Calculate actual distance using coordinates
                    distance = calculateDistance(
                        employeeLatitude, 
                        employeeLongitude, 
                        customerAddress.latitude, 
                        customerAddress.longitude
                    );
                } else if (customerAddress?.zipCode) {
                    // Estimate distance based on zip code (rough approximation)
                    // This is a simplified calculation - in production you'd want more accurate zip-to-coordinate mapping
                    const zipDistance = Math.abs(parseInt(customerAddress.zipCode) - parseInt(employeeZipCodes[0])) / 100;
                    distance = Math.min(zipDistance, 50); // Cap at 50 miles for estimates
                }

                return { 
                    ...service, 
                    distance,
                    distanceText: distance ? `${distance} miles` : 'Distance unknown'
                };
            });

            // Sort by distance (closest first) if we have distance data
            const servicesWithDistance = sortedServices.filter(s => s.distance !== null);
            const servicesWithoutDistance = sortedServices.filter(s => s.distance === null);
            
            servicesWithDistance.sort((a, b) => a.distance - b.distance);
            sortedServices = [...servicesWithDistance, ...servicesWithoutDistance];
        }

        // Check employee's rating for queuing eligibility
        const employeeRating = employee.averageRating || 0;
        const canQueueJobs = employeeRating >= 4.5;
        const hasActiveService = employee.services.length > 0;

        // Limit to closest 15 jobs
        const closestJobs = sortedServices.slice(0, 15);

        // Add employee status information
        const response = {
            services: closestJobs.map(service => ({
                id: service.id,
                customerName: service.customer.user?.name || 'Unknown Customer',
                address: service.customer.address ? {
                    street: service.customer.address.street,
                    city: service.customer.address.city,
                    state: service.customer.address.state,
                    zipCode: service.customer.address.zipCode,
                    latitude: service.customer.address.latitude,
                    longitude: service.customer.address.longitude
                } : null,
                scheduledDate: service.scheduledDate,
                servicePlan: service.servicePlan,
                distance: service.distance,
                distanceText: service.distanceText,
                estimatedEarnings: service.servicePlan?.price || 0
            })),
            message: `Found ${closestJobs.length} available jobs${employeeLatitude && employeeLongitude ? ' (sorted by distance)' : ''}`,
            unlockTime: eightAM.toISOString(),
            currentTime: now.toISOString(),
            employeeLocation: employeeLatitude && employeeLongitude ? {
                latitude: employeeLatitude,
                longitude: employeeLongitude
            } : null,
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
        return NextResponse.json({ 
            error: 'Failed to fetch available services' 
        }, { status: 500 });
    }
}

export async function OPTIONS(request) {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
}
