import { requireRole } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

// GET - Retrieve a specific payment batch by ID
export async function GET(request, { params }) {
    try {
        const user = await requireRole('ADMIN');
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { batchId } = params;
        if (!batchId) {
            return NextResponse.json(
                { error: 'Batch ID is required' },
                { status: 400 }
            );
        }
        const batch = await prisma.paymentBatch.findUnique({
            where: { id: batchId },
            include: {
                payments: {
                    include: {
                        service: {
                            include: {
                                customer: {
                                    include: {
                                        user: {
                                            select: {
                                                name: true,
                                                email: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!batch) {
            return NextResponse.json(
                { error: 'Batch not found' },
                { status: 404 }
            );
        }
        return NextResponse.json(batch);
    }
    catch (error) {
        console.error('Error fetching batch:', error);
        return NextResponse.json(
            { error: 'Failed to fetch batch' },
            { status: 500 }
        );
    }
}
// PUT - Update a specific payment batch
export async function PUT(request, { params }) {
    try {
        const user = await requireRole('ADMIN');
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { batchId } = params;
        if (!batchId) {
            return NextResponse.json(
                { error: 'Batch ID is required' },
                { status: 400 }
            );
        }
        const data = await request.json();
        const updatedBatch = await prisma.paymentBatch.update({
            where: { id: batchId },
            data,
            include: {
                payments: {
                    include: {
                        service: {
                            include: {
                                customer: {
                                    include: {
                                        user: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        return NextResponse.json(updatedBatch);
    }
    catch (error) {
        console.error('Error updating batch:', error);
        return NextResponse.json(
            { error: 'Failed to update batch' },
            { status: 500 }
        );
    }
}
// DELETE - Remove a payment batch (with option to release payments)
export async function DELETE(request, { params }) {
    try {
        const user = await requireRole('ADMIN');
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { batchId } = params;
        if (!batchId) {
            return NextResponse.json(
                { error: 'Batch ID is required' },
                { status: 400 }
            );
        }
        await prisma.paymentBatch.delete({
            where: { id: batchId },
        });
        return NextResponse.json({ success: true });
    }
    catch (error) {
        console.error('Error deleting batch:', error);
        return NextResponse.json(
            { error: 'Failed to delete batch' },
            { status: 500 }
        );
    }
}
