import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

// POST /api/admin/payments/batch/[batchId]/process
// Process all payments in a batch
export async function POST(
  request: Request,
  { params }: { params: { batchId: string } }
) {
  // Verify user is admin
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { batchId } = params;

  try {
    // First check if the batch exists and is ready for processing
    const batch = await prisma.paymentBatch.findUnique({
      where: { id: batchId }
    });

    if (!batch) {
      return NextResponse.json(
        { error: "Payment batch not found" },
        { status: 404 }
      );
    }

    if (batch.status !== "DRAFT" && batch.status !== "FAILED") {
      return NextResponse.json(
        { error: "Batch is already being processed or is completed" },
        { status: 400 }
      );
    }

    // Get request data
    const data = await request.json();
    const { paymentMethod } = data;

    if (!paymentMethod) {
      return NextResponse.json(
        { error: "Payment method is required" },
        { status: 400 }
      );
    }

    // Validate payment method
    if (!["STRIPE", "CASH_APP", "CASH", "CHECK"].includes(paymentMethod)) {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 }
      );
    }

    // Get all payments in the batch
    const payments = await prisma.payment.findMany({
      where: { batchId }
    });

    if (payments.length === 0) {
      return NextResponse.json(
        { error: "No payments in batch" },
        { status: 400 }
      );
    }

    // Start a transaction to update batch status and begin processing
    await prisma.$transaction(async (tx) => {
      // Update batch status to PROCESSING
      await tx.paymentBatch.update({
        where: { id: batchId },
        data: { 
          status: "PROCESSING",
          processingStartedAt: new Date()
        }
      });

      // Update all payments with the payment method
      await tx.payment.updateMany({
        where: { batchId },
        data: { 
          paymentMethod,
          status: "PROCESSING"
        }
      });
    });

    // Process each payment (this will be enhanced with actual payment processing logic)
    let successCount = 0;
    let failedCount = 0;
    const results = [];

    for (const payment of payments) {
      try {
        let result = null;
        
        // Process payment based on payment method
        if (paymentMethod === "STRIPE") {
          // Process with Stripe - this is a simplified example
          if (payment.type === "REFERRAL") {
            // For referral payments, transfer to the referrer
            const referral = await prisma.referral.findUnique({
              where: { id: payment.referralId },
              include: { 
                referrer: {
                  include: { user: true }
                }
              }
            });
            
            if (!referral || !referral.referrer || !referral.referrer.stripeAccountId) {
              throw new Error("Referrer does not have a connected Stripe account");
            }

            // Transfer the money via Stripe Connect
            result = await stripe.transfers.create({
              amount: Math.round(payment.amount * 100), // Convert to cents
              currency: "usd",
              destination: referral.referrer.stripeAccountId,
              transfer_group: `referral-${payment.id}`,
            });
          } else if (payment.type === "EARNINGS") {
            // For earnings payments, transfer to the employee
            const employee = await prisma.employee.findUnique({
              where: { id: payment.employeeId },
              include: { user: true }
            });
            
            if (!employee || !employee.stripeAccountId) {
              throw new Error("Employee does not have a connected Stripe account");
            }

            // Transfer the money via Stripe Connect
            result = await stripe.transfers.create({
              amount: Math.round(payment.amount * 100), // Convert to cents
              currency: "usd",
              destination: employee.stripeAccountId,
              transfer_group: `earnings-${payment.id}`,
            });
          }
        } else if (paymentMethod === "CASH_APP" || paymentMethod === "CASH" || paymentMethod === "CHECK") {
          // For manual payment methods, just record that the payment was made
          result = { id: "manual-payment", status: "succeeded" };
        }

        // Update payment status to PAID
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "PAID",
            paidAt: new Date(),
            notes: paymentMethod === "STRIPE" 
              ? `Paid via Stripe. Transaction ID: ${result.id}`
              : `Paid via ${paymentMethod}. Manually marked as paid.`
          }
        });

        successCount++;
        results.push({
          paymentId: payment.id,
          status: "success",
          method: paymentMethod,
          details: result
        });
      } catch (error) {
        console.error(`Error processing payment ${payment.id}:`, error);
        
        // Update payment status to FAILED
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "FAILED",
            notes: `Failed to process via ${paymentMethod}: ${error.message}`
          }
        });

        failedCount++;
        results.push({
          paymentId: payment.id,
          status: "failed",
          method: paymentMethod,
          error: error.message
        });
      }
    }

    // Update batch status based on results
    const finalStatus = failedCount === 0 ? "COMPLETED" : 
                        successCount === 0 ? "FAILED" : "PARTIAL";
    
    await prisma.paymentBatch.update({
      where: { id: batchId },
      data: {
        status: finalStatus,
        completedAt: finalStatus !== "FAILED" ? new Date() : null,
        notes: `Processed ${successCount} payments successfully. ${failedCount} payments failed.`
      }
    });

    return NextResponse.json({
      message: `Batch processing ${finalStatus.toLowerCase()}`,
      batchId,
      totalPayments: payments.length,
      successCount,
      failedCount,
      status: finalStatus,
      results
    });
  } catch (error) {
    console.error("Error processing batch:", error);
    
    // Update batch status to FAILED
    await prisma.paymentBatch.update({
      where: { id: batchId },
      data: {
        status: "FAILED",
        notes: `Batch processing failed: ${error.message}`
      }
    });
    
    return NextResponse.json(
      { error: "Failed to process payment batch", details: error.message },
      { status: 500 }
    );
  }
} 