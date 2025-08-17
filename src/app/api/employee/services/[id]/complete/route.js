import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateUserToken } from '@/lib/jwt-utils';
import { cookies } from 'next/headers';
import { validateServiceCompletion } from '@/lib/validations';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

const MAX_PHOTOS_PER_SERVICE = 16;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const COMPRESSED_IMAGE_QUALITY = 80;
const COMPRESSED_IMAGE_WIDTH = 1920;

export async function POST(request, { params }) {
    try {
        // Verify employee authorization
        const cookieStore = await cookies();
        const token = cookieStore.get('accessToken')?.value || cookieStore.get('token')?.value;
        
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const decoded = await validateUserToken(token);
        if (!decoded || decoded.role !== 'EMPLOYEE') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const { id: serviceId } = params;
        
        // Get the service and validate it can be completed
        const service = await prisma.service.findUnique({
            where: { id: serviceId },
            include: {
                employee: true,
                customer: true,
                servicePlan: true
            }
        });
        
        if (!service) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 });
        }
        
        // Validate service completion
        const validation = validateServiceCompletion(service, decoded.userId, false);
        if (!validation.isValid) {
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }
        
        // Get request body
        const { notes, photos } = await request.json();
        
        // Check current photo count
        const currentPhotoCount = await prisma.servicePhoto.count({
            where: { serviceId }
        });
        
        // Check if adding these photos would exceed the limit
        if (photos && photos.length > 0 && currentPhotoCount + photos.length > MAX_PHOTOS_PER_SERVICE) {
            return NextResponse.json({ 
                error: `Maximum ${MAX_PHOTOS_PER_SERVICE} photos allowed per service` 
            }, { status: 400 });
        }
        
        // Check if service has at least one photo
        if (!photos || photos.length === 0) {
            return NextResponse.json({ 
                error: 'At least one photo is required to complete the service' 
            }, { status: 400 });
        }
        
        // Process and compress photos
        let compressedPhotos = [];
        if (photos && photos.length > 0) {
            // For now, just store the photos as-is (compression can be added later)
            compressedPhotos = photos.map(photoData => ({
                url: photoData.url,
                type: photoData.type
            }));
        }
        
        // Start a transaction to complete service and deduct credits
        const result = await prisma.$transaction(async (tx) => {
            // Update service status to COMPLETED
            const updatedService = await tx.service.update({
                where: { id: serviceId },
                data: {
                    status: 'COMPLETED',
                    completedDate: new Date(),
                    notes,
                    ...(compressedPhotos.length > 0 && {
                        photos: {
                            create: compressedPhotos.map(photo => ({
                                url: photo.url,
                                type: photo.type
                            }))
                        }
                    })
                },
                include: {
                    employee: true,
                    customer: true,
                    servicePlan: true,
                    photos: true
                }
            });
            
            // Deduct 1 service credit from customer
            const updatedCustomer = await tx.customer.update({
                where: { id: service.customerId },
                data: {
                    serviceCredits: {
                        decrement: 1
                    },
                    updatedAt: new Date()
                }
            });
            
            // Create notification for customer about credit deduction
            await tx.notification.create({
                data: {
                    id: crypto.randomUUID(),
                    userId: service.customer.userId,
                    type: 'credit-deducted',
                    title: 'Service Credit Used',
                    message: `1 service credit has been deducted for your completed service. You now have ${updatedCustomer.serviceCredits} credits remaining.`,
                    metadata: {
                        serviceId: serviceId,
                        creditsDeducted: 1,
                        remainingCredits: updatedCustomer.serviceCredits
                    },
                    createdAt: new Date()
                }
            });
            
            return { updatedService, updatedCustomer };
        });
        
        // Send completion notification to customer via email
        let emailResult = null;
        try {
            const { sendServiceCompletedEmail } = await import('@/lib/unified-email-service');
            emailResult = await sendServiceCompletedEmail(result.updatedService, result.updatedService.employee);
        } catch (emailError) {
            console.error('Email notification failed:', emailError);
            // Don't fail the entire request if email fails
            emailResult = { success: false, error: emailError.message };
        }
        
        return NextResponse.json({
            ...result.updatedService,
            remainingPhotoSlots: MAX_PHOTOS_PER_SERVICE - result.updatedService.photos.length,
            creditsDeducted: 1,
            remainingCredits: result.updatedCustomer.serviceCredits,
            emailSent: emailResult?.success || false
        });
        
    } catch (error) {
        console.error('Error completing service:', error);
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to complete service' }, { status: 500 });
    }
}
