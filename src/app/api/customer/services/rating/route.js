import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/api-auth';

export async function POST(request) {
    try {
        const user = await getAuthUser(request);
        if (!user?.userId || user.role !== 'CUSTOMER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { serviceId, scooperId, rating, feedback, quickRating } = await request.json();

        // Validate required fields
        if (!serviceId || !scooperId || !rating) {
            return NextResponse.json({ 
                error: 'Service ID, scooper ID, and rating are required' 
            }, { status: 400 });
        }

        // Validate rating range
        if (rating < 1 || rating > 5) {
            return NextResponse.json({ 
                error: 'Rating must be between 1 and 5' 
            }, { status: 400 });
        }

        // Check if service exists and belongs to this customer
        const service = await prisma.service.findFirst({
            where: {
                id: serviceId,
                customerId: user.customerId,
                status: 'COMPLETED'
            },
            include: {
                employee: true,
                servicePlan: true
            }
        });

        if (!service) {
            return NextResponse.json({ 
                error: 'Service not found or not completed' 
            }, { status: 404 });
        }

        // Check if customer has already rated this service
        const existingRating = await prisma.customerFeedback.findFirst({
            where: {
                serviceId: serviceId,
                customerId: user.customerId
            }
        });

        if (existingRating) {
            return NextResponse.json({ 
                error: 'You have already rated this service' 
            }, { status: 400 });
        }

        // Create the rating
        const customerRating = await prisma.customerFeedback.create({
            data: {
                serviceId: serviceId,
                customerId: user.customerId,
                employeeId: scooperId,
                rating: rating,
                feedback: feedback || null,
                quickRating: quickRating || null,
                ratingDate: new Date()
            },
            include: {
                service: {
                    include: {
                        servicePlan: true
                    }
                },
                employee: {
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

        // Update employee's average rating
        const employeeRatings = await prisma.customerFeedback.findMany({
            where: {
                employeeId: scooperId,
                rating: { not: null }
            },
            select: {
                rating: true
            }
        });

        if (employeeRatings.length > 0) {
            const totalRating = employeeRatings.reduce((sum, r) => sum + r.rating, 0);
            const averageRating = totalRating / employeeRatings.length;

            await prisma.employee.update({
                where: { id: scooperId },
                data: {
                    averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
                    completedJobs: employeeRatings.length
                }
            });
        }

        // Send notification to employee about the rating
        try {
            const { sendRatingNotificationEmail } = await import('@/lib/unified-email-service');
            await sendRatingNotificationEmail(customerRating);
        } catch (emailError) {
            console.error('Failed to send rating notification email:', emailError);
            // Don't fail the rating submission if email fails
        }

        return NextResponse.json({
            success: true,
            message: 'Rating submitted successfully',
            rating: customerRating
        });

    } catch (error) {
        console.error('Error submitting rating:', error);
        return NextResponse.json({
            error: 'Failed to submit rating',
            details: error.message
        }, { status: 500 });
    }
}

// GET: Get rating for a specific service
export async function GET(request) {
    try {
        const user = await getAuthUser(request);
        if (!user?.userId || user.role !== 'CUSTOMER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const serviceId = searchParams.get('serviceId');

        if (!serviceId) {
            return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
        }

        const rating = await prisma.customerFeedback.findFirst({
            where: {
                serviceId: serviceId,
                customerId: user.customerId
            },
            include: {
                service: {
                    include: {
                        servicePlan: true
                    }
                },
                employee: {
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

        return NextResponse.json({
            success: true,
            rating: rating
        });

    } catch (error) {
        console.error('Error fetching rating:', error);
        return NextResponse.json({
            error: 'Failed to fetch rating',
            details: error.message
        }, { status: 500 });
    }
}
