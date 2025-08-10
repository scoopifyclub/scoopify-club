import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

/**
 * This API endpoint is designed to be called by a CRON job to clean up expired photos.
 * It will:
 * 1. Find all pending PHOTO_CLEANUP tasks that are due
 * 2. Delete the associated photos
 * 3. Mark the cleanup tasks as completed
 */
export async function POST(request) {
    try {
        // Verify API key for security
        const apiKey = request.headers.get('x-api-key');
        if (apiKey !== process.env.CRON_API_KEY) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const now = new Date();
        // Find all pending photo cleanup tasks that are due
        const pendingTasks = await prisma.cleanupTask.findMany({
            where: {
                taskType: 'PHOTO_CLEANUP',
                status: 'PENDING',
                scheduledFor: {
                    lte: now
                }
            }
        });
        const results = {
            processed: 0,
            photosDeleted: 0,
            errors: []
        };
        // Process each task
        for (const task of pendingTasks) {
            try {
                // Find and delete expired photos for this service
                const deletedPhotos = await prisma.servicePhoto.deleteMany({
                    where: {
                        serviceId: task.targetId,
                        expiresAt: {
                            lte: now
                        }
                    }
                });
                // Update the task status
                await prisma.cleanupTask.update({
                    where: { id: task.id },
                    data: {
                        status: 'COMPLETED',
                        completedAt: now,
                        notes: `Deleted ${deletedPhotos.count} photos`
                    }
                });
                results.processed++;
                results.photosDeleted += deletedPhotos.count;
            }
            catch (error) {
                console.error(`Error processing cleanup task ${task.id}:`, error);
                // Update the task status to FAILED
                await prisma.cleanupTask.update({
                    where: { id: task.id },
                    data: {
                        status: 'FAILED',
                        notes: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }
                });
                results.errors.push(`Failed to process task ${task.id}`);
            }
        }
        return NextResponse.json({
            message: 'Photo cleanup completed',
            results
        });
    }
    catch (error) {
        console.error('Error in photo cleanup job:', error);
        return NextResponse.json({ error: 'Failed to process photo cleanup job' }, { status: 500 });
    }
}
