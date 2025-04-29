import { NextResponse } from "next/server";
import { validateUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import prisma from "@/lib/prisma";
// GET - Retrieve a specific payment batch by ID
export async function GET(request, { params }) {
    var _a;
    try {
        const cookieStore = await cookies();
        const accessToken = (_a = cookieStore.get('accessToken')) === null || _a === void 0 ? void 0 : _a.value;
        if (!accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { role } = await validateUser(accessToken, 'ADMIN');
        if (role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { batchId } = await params;
        const batch = await prisma.paymentBatch.findUnique({
            where: {
                id: batchId,
            },
            include: {
                payments: {
                    include: {
                        employee: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                    }
                                }
                            },
                            select: {
                                id: true,
                                cashAppUsername: true,
                                stripeAccountId: true,
                            },
                        },
                        customer: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                    }
                                }
                            },
                            select: {
                                id: true,
                            },
                        },
                        service: {
                            select: {
                                id: true,
                                status: true,
                                scheduledDate: true,
                            },
                        },
                        referredBy: true,
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                },
            },
        });
        if (!batch) {
            return NextResponse.json({ error: "Batch not found" }, { status: 404 });
        }
        return NextResponse.json({ batch });
    }
    catch (error) {
        console.error("Error retrieving payment batch:", error);
        return NextResponse.json({ error: "Failed to retrieve payment batch" }, { status: 500 });
    }
}
// PUT - Update a specific payment batch
export async function PUT(request, { params }) {
    var _a;
    try {
        const cookieStore = await cookies();
        const accessToken = (_a = cookieStore.get('accessToken')) === null || _a === void 0 ? void 0 : _a.value;
        if (!accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { role } = await validateUser(accessToken, 'ADMIN');
        if (role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { batchId } = await params;
        const body = await request.json();
        // Verify the batch exists
        const existingBatch = await prisma.paymentBatch.findUnique({
            where: {
                id: batchId,
            },
        });
        if (!existingBatch) {
            return NextResponse.json({ error: "Batch not found" }, { status: 404 });
        }
        // Update batch data
        const updatedBatch = await prisma.paymentBatch.update({
            where: {
                id: batchId,
            },
            data: {
                name: body.name || undefined,
                description: body.description || undefined,
                status: body.status || undefined,
                processingStartedAt: body.processingStartedAt ? new Date(body.processingStartedAt) : undefined,
                completedAt: body.completedAt ? new Date(body.completedAt) : undefined,
                notes: body.notes !== undefined ? body.notes : undefined,
            },
        });
        return NextResponse.json({ batch: updatedBatch });
    }
    catch (error) {
        console.error("Error updating payment batch:", error);
        return NextResponse.json({ error: "Failed to update payment batch" }, { status: 500 });
    }
}
// DELETE - Remove a payment batch (with option to release payments)
export async function DELETE(request, { params }) {
    var _a;
    try {
        const cookieStore = await cookies();
        const accessToken = (_a = cookieStore.get('accessToken')) === null || _a === void 0 ? void 0 : _a.value;
        if (!accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { role } = await validateUser(accessToken, 'ADMIN');
        if (role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { batchId } = await params;
        const releasePayments = request.nextUrl.searchParams.get("releasePayments") === "true";
        // Verify the batch exists
        const existingBatch = await prisma.paymentBatch.findUnique({
            where: {
                id: batchId,
            },
            include: {
                _count: {
                    select: {
                        payments: true,
                    },
                },
            },
        });
        if (!existingBatch) {
            return NextResponse.json({ error: "Batch not found" }, { status: 404 });
        }
        // Check if batch can be deleted based on status
        if (existingBatch.status === "PROCESSING" || existingBatch.status === "COMPLETED") {
            return NextResponse.json({ error: "Cannot delete batch that is already processing or completed" }, { status: 400 });
        }
        // Run operations in a transaction
        await prisma.$transaction(async (tx) => {
            // If we need to release payments, update them first
            if (releasePayments && existingBatch._count.payments > 0) {
                await tx.payment.updateMany({
                    where: {
                        batchId: batchId,
                    },
                    data: {
                        batchId: null,
                    },
                });
            }
            // Delete the batch
            await tx.paymentBatch.delete({
                where: {
                    id: batchId,
                },
            });
        });
        return NextResponse.json({
            message: "Payment batch deleted successfully",
            paymentsReleased: releasePayments,
        });
    }
    catch (error) {
        console.error("Error deleting payment batch:", error);
        return NextResponse.json({ error: "Failed to delete payment batch" }, { status: 500 });
    }
}
