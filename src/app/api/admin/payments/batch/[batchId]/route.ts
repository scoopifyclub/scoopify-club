import { NextRequest, NextResponse } from "next/server";
import { validateUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import prisma from "@/lib/prisma";

// GET - Retrieve a specific payment batch by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { batchId: string } }
) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;
    
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role } = await validateUser(accessToken, 'ADMIN');
    
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const batchId = params.batchId;

    const batch = await prisma.paymentBatch.findUnique({
      where: {
        id: batchId,
      },
      include: {
        payments: {
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                email: true,
                cashAppUsername: true,
                stripeAccountId: true,
              },
            },
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            service: {
              select: {
                id: true,
                status: true,
                title: true,
              },
            },
            referrer: {
              select: {
                id: true,
                name: true,
                email: true,
                cashAppUsername: true,
                stripeAccountId: true,
              },
            },
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
  } catch (error) {
    console.error("Error retrieving payment batch:", error);
    return NextResponse.json(
      { error: "Failed to retrieve payment batch" },
      { status: 500 }
    );
  }
}

// PUT - Update a specific payment batch
export async function PUT(
  request: NextRequest,
  { params }: { params: { batchId: string } }
) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;
    
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role } = await validateUser(accessToken, 'ADMIN');
    
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const batchId = params.batchId;
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
        type: body.type || undefined,
        status: body.status || undefined,
        scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : undefined,
        processedDate: body.processedDate ? new Date(body.processedDate) : undefined,
        completedDate: body.completedDate ? new Date(body.completedDate) : undefined,
        processedBy: body.processedBy || undefined,
        notes: body.notes !== undefined ? body.notes : undefined,
      },
    });

    return NextResponse.json({ batch: updatedBatch });
  } catch (error) {
    console.error("Error updating payment batch:", error);
    return NextResponse.json(
      { error: "Failed to update payment batch" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a payment batch (with option to release payments)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { batchId: string } }
) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;
    
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role } = await validateUser(accessToken, 'ADMIN');
    
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const batchId = params.batchId;
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
      return NextResponse.json(
        { error: "Cannot delete batch that is already processing or completed" },
        { status: 400 }
      );
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
  } catch (error) {
    console.error("Error deleting payment batch:", error);
    return NextResponse.json(
      { error: "Failed to delete payment batch" },
      { status: 500 }
    );
  }
} 