import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email-service';

export async function POST(req) {
    try {
        const { to, subject, html } = await req.json();
        if (!to || !subject || !html) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const emailResult = await sendEmail({
            to: to,
            subject: subject,
            html: html,
        });

        if (!emailResult.success) {
            console.error('Error sending email:', emailResult.error);
            return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: emailResult });
    } catch (error) {
        console.error('Error in email notification:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
