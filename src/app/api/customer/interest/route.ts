import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email-service';
import { escapeHtml } from '@/lib/escape-html';

export const runtime = 'nodejs';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ZIP_PATTERN = /^\d{5}$/;

const clean = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

// Stores a waitlist lead for a ZIP code we don't serve yet.
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const email = clean(body?.email, 254).toLowerCase();
  const name = clean(body?.name, 200);
  const zipCode = clean(body?.zipCode, 10);

  if (!email || !zipCode) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
  }
  if (!EMAIL_PATTERN.test(email) || !ZIP_PATTERN.test(zipCode)) {
    return NextResponse.json({ error: 'Invalid email or ZIP code.' }, { status: 400 });
  }

  try {
    await prisma.uncoveredInterest.create({
      data: { email, name: name || null, zipCode },
    });
  } catch (err) {
    console.error('Failed to save waitlist lead:', (err as Error)?.message);
    return NextResponse.json({ error: 'Could not save your request. Please try again.' }, { status: 500 });
  }

  try {
    await sendEmail(process.env.ADMIN_EMAIL || 'services@scoopify.club', 'custom', {
      subject: `New waitlist lead for ${zipCode}`,
      replyTo: email,
      html: `<p><b>${escapeHtml(name || 'Someone')}</b> joined the waitlist for <b>${escapeHtml(zipCode)}</b>: ${escapeHtml(email)}</p>`,
    });
  } catch (err) {
    console.error('Failed to notify admin of waitlist lead:', (err as Error)?.message);
  }

  try {
    await sendEmail(email, 'custom', {
      subject: "You're on the Scoopify Club waitlist",
      html: `<h2>Thanks for joining the waitlist!</h2><p>Hi${name ? ' ' + escapeHtml(name) : ''},<br/>We'll let you know as soon as we launch in <b>${escapeHtml(zipCode)}</b>.</p>`,
    });
  } catch (err) {
    console.error('Failed to send waitlist confirmation email:', (err as Error)?.message);
  }

  return NextResponse.json({ success: true });
}
