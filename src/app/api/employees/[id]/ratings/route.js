import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';


export async function GET(request, { params }) {
    try {
        const { id } = params;
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;
        const skip = (page - 1) * limit;

        const [ratings, total] = await Promise.all([
            prisma.serviceRating.findMany({
                where: { employeeId: id },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    customer: {
                        include: {
                            user: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    },
                    service: {
                        select: {
                            scheduledAt: true,
                            servicePlan: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    }
                }
            }),
            prisma.serviceRating.count({
                where: { employeeId: id }
            })
        ]);

        // Get employee's average rating
        const employee = await prisma.employee.findUnique({
            where: { id },
            select: {
                averageRating: true,
                user: {
                    select: {
                        name: true
                    }
                }
            }
        });

        if (!employee) {
            return NextResponse.json(
                { error: 'Employee not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            ratings,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                page,
                limit
            },
            averageRating: employee.averageRating,
            employeeName: employee.user.name
        });

    } catch (error) {
        console.error('Error fetching employee ratings:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 