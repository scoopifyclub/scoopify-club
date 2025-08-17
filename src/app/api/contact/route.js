import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email-service';

export async function POST(request) {
    try {
        const body = await request.json();
        const { name, email, phone, message } = body;
        
        // Validate required fields
        if (!name || !email || !message) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        
        // Send email to admin
        const adminEmailResult = await sendEmail({
            to: process.env.ADMIN_EMAIL || 'hello@scoopify.club',
            subject: 'New Contact Form Submission',
            html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `
        });
        
        if (!adminEmailResult.success) {
            throw new Error('Failed to send admin notification email');
        }
        
        // Send confirmation email to user
        const userEmailResult = await sendEmail({
            to: email,
            subject: 'Thank You for Contacting Scoopify',
            html: `
        <h2>Thank You for Contacting Scoopify</h2>
        <p>Hi ${name},</p>
        <p>We've received your message and will get back to you as soon as possible.</p>
        <p>Here's what you sent us:</p>
        <p>${message}</p>
        <p>Best regards,<br>The Scoopify Team</p>
      `
        });
        
        if (!userEmailResult.success) {
            throw new Error('Failed to send user confirmation email');
        }
        
        return NextResponse.json({ message: 'Contact form submitted successfully' }, { status: 200 });
    }
    catch (error) {
        console.error('Contact form submission error:', error);
        return NextResponse.json({ error: 'Failed to submit contact form' }, { status: 500 });
    }
}
