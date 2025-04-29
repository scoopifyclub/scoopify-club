import { NextResponse } from "next/server";
import { validateUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import prisma from "@/lib/prisma";
// GET /api/admin/payments/batch/[batchId]/payments
// Get all payments in a specific batch
export async function GET(request, { params }) {
    var _a;
    try {
        // Verify user is admin
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
        // First check if the batch exists
        const batch = await prisma.paymentBatch.findUnique({
            where: { id: batchId }
        });
        if (!batch) {
            return NextResponse.json({ error: "Payment batch not found" }, { status: 404 });
        }
        // Get all payments in the batch
        const payments = await prisma.payment.findMany({
            where: { batchId },
            include: {
                employee: {
                    select: {
                        id: true,
                        user: { select: { id: true, name: true, email: true, image: true } }
                    }
                },
                customer: {
                    select: {
                        id: true,
                        user: { select: { id: true, name: true, email: true, image: true } }
                    }
                },
                service: true
            },
            orderBy: { createdAt: "desc" }
        });
        return NextResponse.json(payments);
    }
    catch (error) {
        console.error("Error fetching batch payments:", error);
        return NextResponse.json({ error: "Failed to fetch batch payments" }, { status: 500 });
    }
}
// POST /api/admin/payments/batch/[batchId]/payments
// Add payments to a batch
export async function POST(request, { params }) {
    var _a;
    try {
        // Verify user is admin
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
        // First check if the batch exists and is in DRAFT status
        const batch = await prisma.paymentBatch.findUnique({
            where: { id: batchId }
        });
        if (!batch) {
            return NextResponse.json({ error: "Payment batch not found" }, { status: 404 });
        }
        if (batch.status !== "DRAFT") {
            return NextResponse.json({ error: "Cannot add payments to a batch that is not in DRAFT status" }, { status: 400 });
        }
        // Get payment IDs from request body
        const data = await request.json();
        const { paymentIds } = data;
        if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0) {
            return NextResponse.json({ error: "No payment IDs provided" }, { status: 400 });
        }
        // Update payments to associate them with this batch
        const result = await prisma.payment.updateMany({
            where: {
                id: { in: paymentIds },
                status: "APPROVED", // Only add approved payments
                batchId: null // Only add payments not already in a batch
            },
            data: {
                batchId
            }
        });
        return NextResponse.json({
            message: `Added ${result.count} payments to batch`,
            count: result.count
        });
    }
    catch (error) {
        console.error("Error adding payments to batch:", error);
        return NextResponse.json({ error: "Failed to add payments to batch" }, { status: 500 });
    }
}
// DELETE /api/admin/payments/batch/[batchId]/payments
// Remove payments from a batch
export async function DELETE(request, { params }) {
    var _a;
    try {
        // Verify user is admin
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
        // First check if the batch exists and is in DRAFT status
        const batch = await prisma.paymentBatch.findUnique({
            where: { id: batchId }
        });
        if (!batch) {
            return NextResponse.json({ error: "Payment batch not found" }, { status: 404 });
        }
        if (batch.status !== "DRAFT") {
            return NextResponse.json({ error: "Cannot remove payments from a batch that is not in DRAFT status" }, { status: 400 });
        }
        // Get payment IDs from request body
        const data = await request.json();
        const { paymentIds } = data;
        if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0) {
            return NextResponse.json({ error: "No payment IDs provided" }, { status: 400 });
        }
        // Update payments to disassociate them from this batch
        const result = await prisma.payment.updateMany({
            where: {
                id: { in: paymentIds },
                batchId // Only affect payments in this batch
            },
            data: {
                batchId: null
            }
        });
        return NextResponse.json({
            message: `Removed ${result.count} payments from batch`,
            count: result.count
        });
    }
    catch (error) {
        console.error("Error removing payments from batch:", error);
        return NextResponse.json({ error: "Failed to remove payments from batch" }, { status: 500 });
    }
}
