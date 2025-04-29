import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { verifyToken } from '@/lib/auth';
export async function GET(request) {
    var _a;
    try {
        // Verify admin authorization
        const token = (_a = request.headers.get('Authorization')) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const decoded = await verifyToken(token);
        if (!decoded || decoded.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Get all services with location data
        const services = await prisma.service.findMany({
            where: {
                location: {
                    isNot: null
                }
            },
            include: {
                location: true,
                photos: true,
                customer: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true
                            }
                        },
                        address: true
                    }
                },
                employee: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                }
            }
        });
        // Transform the data for the map
        const mapData = services.map(service => {
            var _a, _b, _c;
            // Get the most recent before and after photos
            const beforePhoto = service.photos.find(p => p.type === 'BEFORE');
            const afterPhoto = service.photos.find(p => p.type === 'AFTER');
            return {
                serviceId: service.id,
                customer: {
                    id: service.customer.id,
                    email: (_a = service.customer.user) === null || _a === void 0 ? void 0 : _a.email,
                    address: service.customer.address
                },
                employee: service.employee ? {
                    id: service.employee.id,
                    name: (_b = service.employee.user) === null || _b === void 0 ? void 0 : _b.name,
                    email: (_c = service.employee.user) === null || _c === void 0 ? void 0 : _c.email
                } : null,
                location: service.location ? {
                    latitude: service.location.latitude,
                    longitude: service.location.longitude
                } : null,
                beforePhoto: beforePhoto ? {
                    id: beforePhoto.id,
                    url: beforePhoto.url,
                    createdAt: beforePhoto.createdAt
                } : null,
                afterPhoto: afterPhoto ? {
                    id: afterPhoto.id,
                    url: afterPhoto.url,
                    createdAt: afterPhoto.createdAt
                } : null,
                scheduledDate: service.scheduledDate,
                completedDate: service.completedDate
            };
        });
        return NextResponse.json({ services: mapData });
    }
    catch (error) {
        console.error('Error fetching map data:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
