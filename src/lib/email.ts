import { Resend } from 'resend';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

interface ServiceCompletionDetails {
  date: string;
  address: string;
  employeeName?: string;
  notes?: string;
  photoUrls?: {
    before: string[];
    after: string[];
  };
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
  serviceDetails: ServiceCompletionDetails
) {
  const subject = `Service ${notificationType.charAt(0).toUpperCase() + notificationType.slice(1)} - Scoopify Club`;
  
  let html = '';
  
  switch (notificationType) {
    case 'claimed':
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Service Update</h2>
          <p>Your service scheduled for ${serviceDetails.date} at ${serviceDetails.address} has been claimed by ${serviceDetails.employeeName}.</p>
          <p>Service ID: ${serviceId}</p>
          <p>If you have any questions, please contact our support team.</p>
          <p>Best regards,<br>Scoopify Club Team</p>
        </div>
      `;
      break;
      
    case 'completed':
      // Create a responsive email template with photos
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Service Completed</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; padding: 20px; color: white; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .photo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0; }
            .photo-section { margin: 20px 0; }
            .photo-title { font-weight: bold; margin-bottom: 10px; }
            img { max-width: 100%; height: auto; border-radius: 4px; }
            .button { display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; }
            @media (max-width: 600px) {
              .photo-grid { grid-template-columns: 1fr; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Your Service is Complete!</h1>
            </div>
            <div class="content">
              <p>Dear Customer,</p>
              <p>Thank you for choosing Scoopify Club! We're pleased to inform you that your yard service at ${serviceDetails.address} has been completed.</p>
              
              ${serviceDetails.employeeName ? `<p>Service provided by: ${serviceDetails.employeeName}</p>` : ''}
              <p>Date: ${serviceDetails.date}</p>
              
              ${serviceDetails.notes ? `
              <div style="background-color: #e9f7ef; padding: 15px; border-radius: 4px; margin: 15px 0;">
                <strong>Service Notes:</strong>
                <p>${serviceDetails.notes}</p>
              </div>
              ` : ''}
              
              ${serviceDetails.photoUrls?.before && serviceDetails.photoUrls.before.length > 0 ? `
              <div class="photo-section">
                <div class="photo-title">Before Service:</div>
                <div class="photo-grid">
                  ${serviceDetails.photoUrls.before.map(url => `
                    <div><img src="${url}" alt="Before service"></div>
                  `).join('')}
                </div>
              </div>
              ` : ''}
              
              ${serviceDetails.photoUrls?.after && serviceDetails.photoUrls.after.length > 0 ? `
              <div class="photo-section">
                <div class="photo-title">After Service:</div>
                <div class="photo-grid">
                  ${serviceDetails.photoUrls.after.map(url => `
                    <div><img src="${url}" alt="After service"></div>
                  `).join('')}
                </div>
              </div>
              ` : ''}
              
              <p>You can view more details and photos in your <a href="${process.env.NEXT_PUBLIC_APP_URL}/customer/dashboard" style="color: #4CAF50;">customer dashboard</a>.</p>
              
              <p>How was your service? We value your feedback:</p>
              <p style="text-align: center; margin: 20px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/customer/feedback/${serviceId}" class="button">Rate Your Service</a>
              </p>
              
              <p>Thank you for your business!</p>
              <p>The Scoopify Club Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Scoopify Club. All rights reserved.</p>
              <p>If you have any questions, please contact our support team.</p>
            </div>
          </div>
        </body>
        </html>
      `;
      break;
      
    case 'scheduled':
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Service Scheduled</h2>
          <p>A new service has been scheduled for ${serviceDetails.date} at ${serviceDetails.address}.</p>
          <p>Service ID: ${serviceId}</p>
          <p>If you have any questions or need to reschedule, please contact our support team.</p>
          <p>Best regards,<br>Scoopify Club Team</p>
        </div>
      `;
      break;
  }

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