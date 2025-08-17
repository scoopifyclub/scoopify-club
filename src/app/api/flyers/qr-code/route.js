import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/api-auth';
import prisma from '@/lib/prisma';

// Force Node.js runtime for QR code generation
export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const { referralCode, employeeId } = await request.json();

    if (!referralCode || !employeeId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify the employee has access to this referral code
    const employee = await prisma.employee.findFirst({
      where: { 
        id: employeeId,
        user: {
          referralCode: referralCode
        }
      },
      include: { user: true }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Unauthorized access to referral code' }, { status: 403 });
    }

    // Generate the referral URL
    const referralUrl = `${process.env.NEXT_PUBLIC_APP_URL}/signup?ref=${referralCode}`;

    // For now, return a simple text representation of the QR code
    // In production, you'd use a QR code generation library like qrcode
    const qrCodeText = `
QR Code for Referral: ${referralCode}

URL: ${referralUrl}

Scan this code or visit the URL above to sign up with your referral code and get $25 off your first service!

Generated for: ${employee.user.firstName} ${employee.user.lastName}
Date: ${new Date().toLocaleDateString()}
    `;

    // Log the QR code generation for tracking
    await prisma.flyerGeneration.create({
      data: {
        employeeId,
        flyerType: 'qr-code',
        referralCode,
        customData: { url: referralUrl },
        generatedAt: new Date()
      }
    });

    // Return the QR code content as text (in production, this would be a PNG image)
    return new NextResponse(qrCodeText, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="qr-code-${referralCode}.txt"`
      }
    });

  } catch (error) {
    console.error('Error generating QR code:', error);
    return NextResponse.json({ error: 'Failed to generate QR code' }, { status: 500 });
  }
}
