import { NextResponse } from 'next/server';
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
    try {
        const { to, subject, html } = await req.json();
        if (!to || !subject || !html) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM,
            to: [to],
            subject,
            html,
        });

        if (error) {
            console.error('Error sending email:', error);
            return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Error in email notification:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
