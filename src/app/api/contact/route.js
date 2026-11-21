import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email-service';
import { escapeHtml } from '@/lib/escape-html';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const clean = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

export async function POST(request) {
    let body;
    try {
        body = await request.json();
    }
    catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const name = clean(body?.name, 200);
    const email = clean(body?.email, 254);
    const phone = clean(body?.phone, 50);
    const subject = clean(body?.subject, 200);
    const message = clean(body?.message, 5000);

    if (!name || !email || !message) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!EMAIL_PATTERN.test(email)) {
        return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'services@scoopify.club';
    try {
        await sendEmail(adminEmail, 'custom', {
            subject: `Contact form: ${subject || name}`.replace(/[\r\n]+/g, ' '),
            replyTo: email,
            html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        ${phone ? `<p><strong>Phone:</strong> ${escapeHtml(phone)}</p>` : ''}
        ${subject ? `<p><strong>Subject:</strong> ${escapeHtml(subject)}</p>` : ''}
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap;">${escapeHtml(message)}</p>
      `
        });
    }
    catch (error) {
        console.error('Contact form admin email failed:', error?.message);
        return NextResponse.json({ error: 'Failed to submit contact form' }, { status: 500 });
    }

    // The confirmation goes to an unverified address, so it never echoes the message back.
    try {
        await sendEmail(email, 'custom', {
            subject: 'We received your message - Scoopify Club',
            html: `
        <h2>Thanks for contacting Scoopify Club</h2>
        <p>Hi ${escapeHtml(name)},</p>
        <p>We've received your message and will get back to you as soon as possible.</p>
        <p>Best regards,<br>The Scoopify Club Team</p>
      `
        });
    }
    catch (error) {
        console.error('Contact form confirmation email failed:', error?.message);
    }

    return NextResponse.json({ message: 'Contact form submitted successfully' }, { status: 200 });
}
