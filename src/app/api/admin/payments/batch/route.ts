import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { logPaymentEvent } from '@/lib/payment-audit';
import { logger } from '@/lib/logger';

// GET /api/admin/payments/batch
// Get all payment batches with optional filters
export async function GET(request: Request) {
  // Verify user is admin
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const skip = (page - 1) * limit;

  // Build the query
  const query: any = {};
  if (status) {
    query.status = status;
  }

  try {
    // Get total count for pagination
    const totalCount = await prisma.paymentBatch.count({
      where: query
    });

    // Get batches with payments count
    const batches = await prisma.paymentBatch.findMany({
      where: query,
      include: {
        _count: {
          select: { payments: true }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });

    // Calculate total batch amounts
    const batchesWithTotals = await Promise.all(
      batches.map(async (batch) => {
        const payments = await prisma.payment.findMany({
          where: { batchId: batch.id },
          select: { amount: true }
        });
        
        const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
        
        return {
          ...batch,
          totalAmount,
          paymentsCount: batch._count.payments
        };
      })
    );

    return NextResponse.json({
      batches: batchesWithTotals,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching payment batches:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment batches" },
      { status: 500 }
    );
  }
}

// POST /api/admin/payments/batch
// Create a new payment batch
export async function POST(request: Request) {
  // Verify user is admin
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { name, description } = data;

    if (!name) {
      return NextResponse.json(
        { error: "Batch name is required" },
        { status: 400 }
      );
    }

    // Create new payment batch
    const batch = await prisma.paymentBatch.create({
      data: {
        name,
        description,
        status: "DRAFT",
        createdById: session.user.id
      }
    });

    return NextResponse.json(batch);
  } catch (error) {
    console.error("Error creating payment batch:", error);
    return NextResponse.json(
      { error: "Failed to create payment batch" },
      { status: 500 }
    );
  }
}

// PUT: Update a batch (add/remove payments, change date)
export async function PUT(request: Request) {
  try {
    // Verify admin permission
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { batchId, scheduledDate, addPaymentIds, removePaymentIds, status, notes } = await request.json();

    // Validate input
    if (!batchId) {
      return NextResponse.json(
        { error: 'Batch ID is required' },
        { status: 400 }
      );
    }

    // Update batch in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get current batch
      const batch = await tx.paymentBatch.findUnique({
        where: { id: batchId }
      });
      
      if (!batch) {
        throw new Error('Batch not found');
      }
      
      // Prevent updates to completed or processed batches
      if (batch.status === 'COMPLETED' || batch.status === 'PROCESSING') {
        throw new Error(`Cannot update batch in ${batch.status} status`);
      }
      
      // Update data object
      const updateData: any = {};
      
      if (scheduledDate) {
        const scheduledDateObj = new Date(scheduledDate);
        updateData.scheduledDate = scheduledDateObj;
        updateData.approvalDeadline = new Date(scheduledDateObj.getTime() - 24 * 60 * 60 * 1000);
      }
      
      if (status) {
        updateData.status = status;
        
        // If marked as PROCESSING, set processedDate
        if (status === 'PROCESSING') {
          updateData.processedDate = new Date();
        }
      }
      
      if (notes !== undefined) {
        updateData.notes = notes;
      }
      
      // Update batch
      const updatedBatch = await tx.paymentBatch.update({
        where: { id: batchId },
        data: updateData
      });
      
      // Add payments to batch if provided
      if (addPaymentIds && Array.isArray(addPaymentIds) && addPaymentIds.length > 0) {
        // Verify payments exist and are in APPROVED status
        const payments = await tx.payment.findMany({
          where: {
            id: { in: addPaymentIds },
            status: 'APPROVED',
            batchId: null
          }
        });
        
        if (payments.length !== addPaymentIds.length) {
          throw new Error('Some payment IDs are invalid, already in a batch, or not in APPROVED status');
        }
        
        // Update payments to associate with batch
        await tx.payment.updateMany({
          where: {
            id: { in: addPaymentIds }
          },
          data: {
            batchId
          }
        });
        
        // Log events for each payment
        for (const paymentId of addPaymentIds) {
          await logPaymentEvent(
            paymentId,
            'BATCH_ADDED',
            {
              batchId,
              scheduledDate: updatedBatch.scheduledDate,
              adminId: session.user.id
            },
            session.user.id
          );
        }
      }
      
      // Remove payments from batch if provided
      if (removePaymentIds && Array.isArray(removePaymentIds) && removePaymentIds.length > 0) {
        // Update payments to disassociate from batch
        await tx.payment.updateMany({
          where: {
            id: { in: removePaymentIds },
            batchId
          },
          data: {
            batchId: null
          }
        });
        
        // Log events for each payment
        for (const paymentId of removePaymentIds) {
          await logPaymentEvent(
            paymentId,
            'BATCH_REMOVED',
            {
              batchId,
              adminId: session.user.id
            },
            session.user.id
          );
        }
      }
      
      // Get updated batch with payments
      return tx.paymentBatch.findUnique({
        where: { id: batchId },
        include: {
          payments: true,
          _count: {
            select: { payments: true }
          }
        }
      });
    });
    
    return NextResponse.json({
      message: 'Payment batch updated successfully',
      batch: result
    });
  } catch (error) {
    logger.error('Error updating payment batch:', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update payment batch' },
      { status: error instanceof Error && error.message.includes('not found') ? 404 : 500 }
    );
  }
} 