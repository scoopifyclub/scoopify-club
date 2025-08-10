import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import PDFDocument from 'pdfkit';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function GET(request, { params }) {
    var _a, _b, _c, _d, _e, _f, _g;
    try {
        // Verify admin authorization
        const token = (_a = request.headers.get('Authorization')) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const payload = await verifyToken(token);
        if (payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        // Fetch payment with related data
        const payment = await prisma.payment.findUnique({
            where: { id: (await params).paymentId },
            include: {
                referredBy: {
                    select: {
                        name: true,
                        email: true
                    }
                },
                customer: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                email: true
                            }
                        },
                        subscription: {
                            select: {
                                planId: true
                            }
                        }
                    }
                }
            }
        });
        if (!payment) {
            return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
        }
        // Create PDF document
        const doc = new PDFDocument();
        const chunks = [];
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
            .text(`Date: ${new Date(payment.createdAt).toLocaleDateString()}`)
            .text(`Payment Method: ${payment.paymentMethod || 'Not specified'}`)
            .moveDown();
        // Add referrer details
        doc
            .text('Referrer Details:')
            .text(`Name: ${((_b = payment.referredBy) === null || _b === void 0 ? void 0 : _b.name) || 'Unknown'}`)
            .text(`Email: ${((_c = payment.referredBy) === null || _c === void 0 ? void 0 : _c.email) || 'Unknown'}`)
            .moveDown();
        // Add referred customer details
        doc
            .text('Referred Customer Details:')
            .text(`Name: ${((_e = (_d = payment.customer) === null || _d === void 0 ? void 0 : _d.user) === null || _e === void 0 ? void 0 : _e.name) || 'Unknown'}`)
            .text(`Subscription ID: ${((_g = (_f = payment.customer) === null || _f === void 0 ? void 0 : _f.subscription) === null || _g === void 0 ? void 0 : _g.planId) || 'Unknown'}`)
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
    }
    catch (error) {
        console.error('Error generating receipt:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
