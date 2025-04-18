import { Resend } from 'resend';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    const data = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to,
      subject,
      html,
    });

    if (!data) {
      throw new Error('Failed to send email');
    }

    return data;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

export const sendPasswordResetEmail = async (email: string, resetToken: string) => {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
  const html = `
    <h1>Password Reset Request</h1>
    <p>You requested a password reset. Click the link below to reset your password:</p>
    <a href="${resetUrl}">Reset Password</a>
    <p>This link will expire in 1 hour.</p>
  `;
  return sendEmail({
    to: email,
    subject: 'Password Reset Request',
    html,
  });
};

export async function sendServiceNotificationEmail(
  email: string,
  serviceId: string,
  notificationType: 'claimed' | 'completed' | 'scheduled',
  serviceDetails: {
    date: string;
    address: string;
    employeeName?: string;
  }
) {
  const subject = `Service ${notificationType.charAt(0).toUpperCase() + notificationType.slice(1)} - Scoopify Club`;
  
  let message = '';
  switch (notificationType) {
    case 'claimed':
      message = `Your service scheduled for ${serviceDetails.date} at ${serviceDetails.address} has been claimed by ${serviceDetails.employeeName}.`;
      break;
    case 'completed':
      message = `Your service at ${serviceDetails.address} has been completed. Thank you for choosing Scoopify Club!`;
      break;
    case 'scheduled':
      message = `A new service has been scheduled for ${serviceDetails.date} at ${serviceDetails.address}.`;
      break;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Service Update</h2>
      <p>${message}</p>
      <p>Service ID: ${serviceId}</p>
      <p>If you have any questions, please contact our support team.</p>
      <p>Best regards,<br>Scoopify Club Team</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject,
    html,
  });
}

export const sendAdminNotification = async (subject: string, message: string) => {
  const html = `
    <h1>${subject}</h1>
    <p>${message}</p>
  `;
  return sendEmail({
    to: process.env.ADMIN_EMAIL || '',
    subject,
    html,
  });
};

export async function sendPaymentFailedEmail(
  customerEmail: string,
  customerName: string,
  retryDate: Date
) {
  try {
    // Send to customer
    await sendEmail({
      to: customerEmail,
      subject: 'Payment Failed - Service Paused',
      html: `
        <h1>Payment Failed Notification</h1>
        <p>Hello ${customerName},</p>
        <p>We were unable to process your recent payment. Your service has been temporarily paused.</p>
        <p>We will automatically retry the payment on ${retryDate.toLocaleDateString()}.</p>
        <p>If you'd like to update your payment information or have any questions, please contact us.</p>
        <p>Best regards,<br>Scoopify Team</p>
      `,
    });

    // Send to admin
    await sendEmail({
      to: process.env.ADMIN_EMAIL || '',
      subject: `Payment Failed - ${customerName}`,
      html: `
        <h1>Payment Failed Alert</h1>
        <p>Customer: ${customerName}</p>
        <p>Email: ${customerEmail}</p>
        <p>Payment retry scheduled for: ${retryDate.toLocaleDateString()}</p>
      `,
    });
  } catch (error) {
    console.error('Error sending payment failed emails:', error);
  }
}

export async function sendPaymentRetryEmail(
  customerEmail: string,
  customerName: string
) {
  try {
    await sendEmail({
      to: customerEmail,
      subject: 'Payment Retry Scheduled',
      html: `
        <h1>Payment Retry Notification</h1>
        <p>Hello ${customerName},</p>
        <p>We will attempt to process your payment again today.</p>
        <p>If successful, your service will resume automatically.</p>
        <p>If you'd like to update your payment information, please contact us.</p>
        <p>Best regards,<br>Scoopify Team</p>
      `,
    });
  } catch (error) {
    console.error('Error sending payment retry email:', error);
  }
} 