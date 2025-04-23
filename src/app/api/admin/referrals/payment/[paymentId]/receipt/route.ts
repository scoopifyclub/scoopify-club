import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import PDFDocument from 'pdfkit';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    // Verify admin authorization
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch payment with related data
    const payment = await prisma.referralPayment.findUnique({
      where: { id: (await params).paymentId },
      include: {
        referral: {
          include: {
            referrer: {
              select: {
                name: true,
                email: true,
                cashAppTag: true,
              },
            },
            referred: {
              select: {
                name: true,
                subscription: {
                  select: {
                    plan: {
                      select: {
                        name: true,
                        price: true,
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

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Create PDF document
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    
    // Add company logo/header
    doc
      .fontSize(20)
      .text('ScoopifyClub', { align: 'center' })
      .moveDown();

    // Add receipt details
    doc
      .fontSize(16)
      .text('Referral Payment Receipt', { align: 'center' })
      .moveDown();

    doc
      .fontSize(12)
      .text(`Receipt ID: ${payment.id}`)
      .text(`Date: ${new Date(payment.paymentDate).toLocaleDateString()}`)
      .text(`Cash App Payment ID: ${payment.cashAppPaymentId}`)
      .moveDown();

    // Add referrer details
    doc
      .text('Referrer Details:')
      .text(`Name: ${payment.referral.referrer.name}`)
      .text(`Email: ${payment.referral.referrer.email}`)
      .text(`Cash App: ${payment.referral.referrer.cashAppTag || 'Not provided'}`)
      .moveDown();

    // Add referred customer details
    doc
      .text('Referred Customer Details:')
      .text(`Name: ${payment.referral.referred.name}`)
      .text(`Plan: ${payment.referral.referred.subscription.plan.name}`)
      .text(`Plan Price: $${payment.referral.referred.subscription.plan.price.toFixed(2)}`)
      .moveDown();

    // Add payment details
    doc
      .text('Payment Details:')
      .text(`Amount: $${payment.amount.toFixed(2)}`)
      .text(`Status: ${payment.status}`)
      .moveDown();

    // Add footer
    doc
      .fontSize(10)
      .text('Thank you for being part of our referral program!', { align: 'center' })
      .text('For any questions, please contact support@scoopifyclub.com', { align: 'center' });

    // End the document
    doc.end();

    // Combine chunks into a single buffer
    const pdfBuffer = Buffer.concat(chunks);

    // Create response with PDF content
    const response = new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="receipt-${payment.id}.pdf"`,
      },
    });

    return response;
  } catch (error) {
    console.error('Error generating receipt:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 