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
        // Get query parameters
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const serviceId = searchParams.get('serviceId');
        const type = searchParams.get('type');
        // Build where clause
        const where = {};
        if (serviceId)
            where.serviceId = serviceId;
        if (type)
            where.type = type;
        // Get photos with pagination
        const [photos, total] = await Promise.all([
            prisma.servicePhoto.findMany({
                where,
                include: {
                    service: {
                        include: {
                            customer: {
                                include: {
                                    user: true,
                                    address: true
                                }
                            },
                            employee: {
                                include: {
                                    user: true
                                }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit
            }),
            prisma.servicePhoto.count({ where })
        ]);
        return NextResponse.json({
            photos,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        console.error('Error fetching photos:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
