import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { validateUserToken } from '@/lib/jwt-utils';
import { cookies } from 'next/headers';
import { z } from 'zod';

export const runtime = 'nodejs';

// Validation schema for photo upload
const photoUploadSchema = z.object({
    photos: z.array(z.object({
        url: z.string().url(),
        type: z.enum(['BEFORE', 'AFTER', 'GATE']),
        description: z.string().optional()
    })).min(1, 'At least one photo is required'),
    serviceId: z.string()
});

export async function POST(request, { params }) {
    try {
        const { id: serviceId } = params;
        
        // Get and validate token
        const cookieStore = await cookies();
        const token = cookieStore.get('accessToken')?.value;
        
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userId } = await validateUserToken(token, 'EMPLOYEE');
        
        // Get the service and validate employee ownership
        const service = await prisma.service.findFirst({
            where: {
                id: serviceId,
                employeeId: userId
            },
            include: {
                photos: true
            }
        });

        if (!service) {
            return NextResponse.json({ error: 'Service not found or not assigned' }, { status: 404 });
        }

        // Parse request body
        const body = await request.json();
        const validatedData = photoUploadSchema.parse(body);

        // Validate photo requirements
        const beforePhotos = validatedData.photos.filter(p => p.type === 'BEFORE');
        const afterPhotos = validatedData.photos.filter(p => p.type === 'AFTER');
        const gatePhotos = validatedData.photos.filter(p => p.type === 'GATE');

        // Check minimum requirements
        if (beforePhotos.length < 4) {
            return NextResponse.json({ 
                error: 'At least 4 BEFORE photos are required' 
            }, { status: 400 });
        }

        if (afterPhotos.length < 4) {
            return NextResponse.json({ 
                error: 'At least 4 AFTER photos are required' 
            }, { status: 400 });
        }

        if (gatePhotos.length < 1) {
            return NextResponse.json({ 
                error: 'At least 1 GATE photo is required' 
            }, { status: 400 });
        }

        // Use a transaction to create photos and update service
        const result = await prisma.$transaction(async (tx) => {
            // Create all photos
            const createdPhotos = await Promise.all(
                validatedData.photos.map(async (photo) => {
                    return await tx.servicePhoto.create({
                        data: {
                            id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            url: photo.url,
                            type: photo.type,
                            serviceId: serviceId,
                            description: photo.description,
                            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
                        }
                    });
                })
            );

            // Update service with photo IDs
            const beforePhotoIds = beforePhotos.map(p => p.url);
            const afterPhotoIds = afterPhotos.map(p => p.url);
            const gatePhotoId = gatePhotos[0]?.url;

            await tx.service.update({
                where: { id: serviceId },
                data: {
                    beforePhotoIds,
                    afterPhotoIds,
                    gatePhotoId,
                    updatedAt: new Date()
                }
            });

            return createdPhotos;
        });

        return NextResponse.json({
            success: true,
            message: 'Photos uploaded successfully',
            photos: result,
            photoCounts: {
                before: beforePhotos.length,
                after: afterPhotos.length,
                gate: gatePhotos.length
            }
        });

    } catch (error) {
        console.error('Photo upload error:', error);
        
        if (error instanceof z.ZodError) {
            return NextResponse.json({
                error: 'Invalid photo data',
                details: error.errors
            }, { status: 400 });
        }

        return NextResponse.json({
            error: 'Failed to upload photos'
        }, { status: 500 });
    }
}

export async function GET(request, { params }) {
    try {
        const { id: serviceId } = params;
        
        // Get and validate token
        const cookieStore = await cookies();
        const token = cookieStore.get('accessToken')?.value;
        
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userId } = await validateUserToken(token);
        
        // Get the service with photos
        const service = await prisma.service.findFirst({
            where: { id: serviceId },
            include: {
                photos: {
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        if (!service) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 });
        }

        // Verify authorization (employee assigned or customer owner)
        if (service.employeeId !== userId && service.customerId !== userId) {
            return NextResponse.json({ error: 'Not authorized to view this service' }, { status: 403 });
        }

        // Organize photos by type
        const photos = {
            before: service.photos.filter(p => p.type === 'BEFORE'),
            after: service.photos.filter(p => p.type === 'AFTER'),
            gate: service.photos.filter(p => p.type === 'GATE')
        };

        return NextResponse.json({
            success: true,
            photos,
            serviceId: service.id
        });

    } catch (error) {
        console.error('Error fetching photos:', error);
        return NextResponse.json({
            error: 'Failed to fetch photos'
        }, { status: 500 });
    }
}

export async function OPTIONS(request) {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
}
