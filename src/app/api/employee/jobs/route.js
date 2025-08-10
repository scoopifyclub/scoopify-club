import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { verifyToken } from '@/lib/api-auth';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';


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

        // Get the zip codes this employee covers
        const coveredZipCodes = employee.serviceAreas.map(area => area.zipCode);
        
        if (coveredZipCodes.length === 0) {
            return NextResponse.json([]);
        }

        // Get all unclaimed services in employee's service areas
        const availableServices = await prisma.service.findMany({
            where: {
                status: 'SCHEDULED',
                employeeId: null, // Only unclaimed services
                customer: {
                    address: {
                        zipCode: {
                            in: coveredZipCodes
                        }
                    }
                },
                scheduledDate: {
                    gte: new Date() // Only future services
                }
            },
            include: {
                customer: {
                    include: {
                        address: true,
                        user: true
                    }
                }
            },
            orderBy: {
                scheduledDate: 'asc'
            }
        });

        console.log(`Found ${availableServices.length} available services for employee ${employee.id} in zip codes:`, coveredZipCodes);

        // Format services for the employee dashboard
        const formattedServices = availableServices.map(service => {
            // Calculate payment based on service type and complexity
            let payment = 25; // Base rate
            
            // Adjust based on service type
            const serviceType = service.serviceType || 'Pet Waste Cleanup';
            if (serviceType.includes('weekly') || serviceType.includes('regular')) {
                payment = 30; // Regular weekly service
            } else if (serviceType.includes('one-time')) {
                payment = 45; // One-time service
            }

            // Estimate duration
            const estimatedDuration = serviceType.includes('one-time') ? 45 : 30;

            return {
                id: service.id,
                scheduledDate: service.scheduledDate,
                scheduledFor: service.scheduledDate, // Maintain backward compatibility
                serviceType: serviceType,
                type: serviceType, // Maintain backward compatibility
                estimatedDuration,
                payment,
                specialInstructions: service.specialInstructions,
                customer: {
                    name: service.customer.user.name,
                    phone: service.customer.phone,
                    address: {
                        street: service.customer.address.street,
                        city: service.customer.address.city,
                        state: service.customer.address.state,
                        zipCode: service.customer.address.zipCode
                    },
                    gateCode: service.customer.gateCode
                },
                // Legacy fields for backward compatibility
                address: {
                    street: service.customer.address.street,
                    city: service.customer.address.city,
                    state: service.customer.address.state,
                    zipCode: service.customer.address.zipCode
                }
            };
        });

        return NextResponse.json(formattedServices);
    }
    catch (error) {
        console.error('Error fetching available jobs:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch available jobs', 
            details: error.message 
        }, { status: 500 });
    }
}
