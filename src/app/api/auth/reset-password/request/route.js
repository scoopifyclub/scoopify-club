import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { randomBytes } from 'crypto';
import { sendEmail } from '@/lib/email';
export async function POST(request) {
    try {
        const { email } = await request.json();
        if (!email) {
            return new NextResponse('Email is required', { status: 400 });
        }
        const user = await prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            // Return success even if user doesn't exist to prevent email enumeration
            return new NextResponse('If an account exists, you will receive a password reset email', { status: 200 });
        }
        // Generate reset token
        const resetToken = randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now
        // Store reset token in database
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                resetTokenExpiry,
            },
        });
        // Send reset email
        const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
        await sendEmail({
            to: email,
            subject: 'Password Reset Request',
            html: `
        <h1>Password Reset Request</h1>
        <p>You requested a password reset for your account.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
        });
        return new NextResponse('If an account exists, you will receive a password reset email', { status: 200 });
    }
    catch (error) {
        console.error('Password reset request error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
