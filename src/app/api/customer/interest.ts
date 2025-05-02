import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

import { sendMail } from '@/lib/sendMail';

// Store interest for uncovered zip codes
export async function POST(request: Request) {
  const { email, name, zipCode } = await request.json();
  if (!email || !zipCode) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
  }
  // Store in a new table or fallback to a generic table (here: create Interest table if not exists)
  await prisma.uncoveredInterest.create({
    data: {
      email,
      name,
      zipCode,
      createdAt: new Date(),
    },
  });

  // Send confirmation email to user
  try {
    await sendMail({
      to: email,
      subject: 'You’re on the Scoopify Club Waitlist!',
      html: `<h2>Thank you for joining the waitlist!</h2><p>Hi${name ? ' ' + name : ''},<br/>We’ll notify you as soon as we launch in <b>${zipCode}</b>. In the meantime, invite friends and neighbors to join the waitlist—the more interest, the sooner we launch!</p><p>Follow us on social media for updates!</p>`,
      text: `Thank you for joining the Scoopify Club waitlist! We’ll notify you as soon as we launch in ${zipCode}. Invite friends and neighbors to help us launch sooner!`,
    });
  } catch (err) {
    // Log and continue
    console.error('Failed to send waitlist confirmation email:', err);
  }

  // Notify admin(s)
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    try {
      await sendMail({
        to: adminEmail,
        subject: 'New Waitlist Signup',
        html: `<p><b>${name || 'Someone'}</b> joined the waitlist for <b>${zipCode}</b>: ${email}</p>`,
        text: `${name || 'Someone'} joined the waitlist for ${zipCode}: ${email}`,
      });
    } catch (err) {
      console.error('Failed to notify admin of waitlist signup:', err);
    }
  }

  return NextResponse.json({ success: true });
}
