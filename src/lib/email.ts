import nodemailer from 'nodemailer';

if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
  throw new Error('SMTP configuration is incomplete in environment variables');
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
};

export const sendPasswordResetEmail = async (email: string, resetToken: string) => {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
  const html = `
    <h1>Password Reset Request</h1>
    <p>You requested a password reset. Click the link below to reset your password:</p>
    <a href="${resetUrl}">Reset Password</a>
    <p>This link will expire in 1 hour.</p>
  `;
  return sendEmail(email, 'Password Reset Request', html);
};

export const sendServiceNotification = async (email: string, serviceDetails: any) => {
  const html = `
    <h1>Service Update</h1>
    <p>Your service has been ${serviceDetails.status.toLowerCase()}.</p>
    <p>Details:</p>
    <ul>
      <li>Date: ${new Date(serviceDetails.scheduledFor).toLocaleDateString()}</li>
      <li>Status: ${serviceDetails.status}</li>
      ${serviceDetails.employee ? `<li>Employee: ${serviceDetails.employee.name}</li>` : ''}
    </ul>
  `;
  return sendEmail(email, 'Service Update', html);
};

export const sendAdminNotification = async (subject: string, message: string) => {
  const html = `
    <h1>${subject}</h1>
    <p>${message}</p>
  `;
  return sendEmail(process.env.ADMIN_EMAIL || '', subject, html);
};

export async function sendPaymentFailedEmail(
  customerEmail: string,
  customerName: string,
  retryDate: Date
) {
  try {
    // Send to customer
    await sendEmail(customerEmail, 'Payment Failed - Service Paused', `
      <h1>Payment Failed Notification</h1>
      <p>Hello ${customerName},</p>
      <p>We were unable to process your recent payment. Your service has been temporarily paused.</p>
      <p>We will automatically retry the payment on ${retryDate.toLocaleDateString()}.</p>
      <p>If you'd like to update your payment information or have any questions, please contact us.</p>
      <p>Best regards,<br>Scoopify Team</p>
    `);

    // Send to admin
    await sendEmail(process.env.ADMIN_EMAIL || '', `Payment Failed - ${customerName}`, `
      <h1>Payment Failed Alert</h1>
      <p>Customer: ${customerName}</p>
      <p>Email: ${customerEmail}</p>
      <p>Payment retry scheduled for: ${retryDate.toLocaleDateString()}</p>
    `);
  } catch (error) {
    console.error('Error sending payment failed emails:', error);
  }
}

export async function sendPaymentRetryEmail(
  customerEmail: string,
  customerName: string
) {
  try {
    await sendEmail(customerEmail, 'Payment Retry Scheduled', `
      <h1>Payment Retry Notification</h1>
      <p>Hello ${customerName},</p>
      <p>We will attempt to process your payment again today.</p>
      <p>If successful, your service will resume automatically.</p>
      <p>If you'd like to update your payment information, please contact us.</p>
      <p>Best regards,<br>Scoopify Team</p>
    `);
  } catch (error) {
    console.error('Error sending payment retry email:', error);
  }
} 