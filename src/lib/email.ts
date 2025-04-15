import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPaymentFailedEmail(
  customerEmail: string,
  customerName: string,
  retryDate: Date
) {
  try {
    // Send to customer
    await resend.emails.send({
      from: 'Scoopify <notifications@scoopify.com>',
      to: customerEmail,
      subject: 'Payment Failed - Service Paused',
      html: `
        <h1>Payment Failed Notification</h1>
        <p>Hello ${customerName},</p>
        <p>We were unable to process your recent payment. Your service has been temporarily paused.</p>
        <p>We will automatically retry the payment on ${retryDate.toLocaleDateString()}.</p>
        <p>If you'd like to update your payment information or have any questions, please contact us.</p>
        <p>Best regards,<br>Scoopify Team</p>
      `
    });

    // Send to admin
    await resend.emails.send({
      from: 'Scoopify <notifications@scoopify.com>',
      to: process.env.ADMIN_EMAIL || 'admin@scoopify.com',
      subject: `Payment Failed - ${customerName}`,
      html: `
        <h1>Payment Failed Alert</h1>
        <p>Customer: ${customerName}</p>
        <p>Email: ${customerEmail}</p>
        <p>Payment retry scheduled for: ${retryDate.toLocaleDateString()}</p>
      `
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
    await resend.emails.send({
      from: 'Scoopify <notifications@scoopify.com>',
      to: customerEmail,
      subject: 'Payment Retry Scheduled',
      html: `
        <h1>Payment Retry Notification</h1>
        <p>Hello ${customerName},</p>
        <p>We will attempt to process your payment again today.</p>
        <p>If successful, your service will resume automatically.</p>
        <p>If you'd like to update your payment information, please contact us.</p>
        <p>Best regards,<br>Scoopify Team</p>
      `
    });
  } catch (error) {
    console.error('Error sending payment retry email:', error);
  }
} 