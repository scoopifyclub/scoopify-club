import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/api-auth';
import { cookies } from 'next/headers';
import { emitServiceUpdate } from '@/lib/socket';

export async function POST(request, { params }) {
    try {
        const token = cookies().get('token')?.value;
        const user = await verifyToken(token);

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized access' },
                { status: 401 }
            );
        }

        const { id } = params;
        const { rating, comment } = await request.json();

        // Validate rating
        if (!rating || rating < 1 || rating > 5) {
            return NextResponse.json(
                { error: 'Rating must be between 1 and 5' },
                { status: 400 }
            );
        }

        // Get the service and verify it's completed
        const service = await prisma.service.findUnique({
            where: { id: serviceId },
            include: {
                customer: true,
                employee: true,
                rating: true
            }
        });

        if (!service) {
            return NextResponse.json(
                { error: 'Service not found' },
                { status: 404 }
            );
        }

        if (service.status !== 'COMPLETED') {
            return NextResponse.json(
                { error: 'Can only rate completed services' },
                { status: 400 }
            );
        }

        // Verify the user is the customer of this service
        if (service.customer.userId !== user.id) {
            return NextResponse.json(
                { error: 'Only the customer can rate this service' },
                { status: 403 }
            );
        }

        // Check if service is already rated
        if (service.rating) {
            return NextResponse.json(
                { error: 'Service already rated' },
                { status: 400 }
            );
        }

        // Create rating in a transaction and update employee average rating
        const serviceRating = await prisma.$transaction(async (tx) => {
            // Create the rating
            const newRating = await tx.serviceRating.create({
                data: {
                    rating,
                    comment,
                    serviceId,
                    customerId: service.customerId,
                    employeeId: service.employeeId
                }
            });

            // Calculate new average rating for employee
            const employeeRatings = await tx.serviceRating.findMany({
                where: { employeeId: service.employeeId }
            });

            const averageRating = employeeRatings.reduce((acc, curr) => acc + curr.rating, 0) / employeeRatings.length;

            // Update employee average rating
            await tx.employee.update({
                where: { id: service.employeeId },
                data: { averageRating }
            });

            return newRating;
        });

        // Emit real-time update
        emitServiceUpdate(serviceId, {
            message: 'Service rated',
            details: `Rating: ${rating}/5${comment ? ` - "${comment}"` : ''}`,
            rating: serviceRating
        });

        return NextResponse.json({
            message: 'Rating submitted successfully',
            rating: serviceRating
        });

    } catch (error) {
        console.error('Error submitting rating:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Get rating for a service
export async function GET(request, { params }) {
    try {
        const { id } = params;

        const rating = await prisma.serviceRating.findFirst({
            where: { serviceId },
            include: {
                customer: {
                    include: {
                        user: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        });

        if (!rating) {
            return NextResponse.json(
                { error: 'Rating not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(rating);

    } catch (error) {
        console.error('Error fetching rating:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 