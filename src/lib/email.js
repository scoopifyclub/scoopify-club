'use client';

import nodemailer from 'nodemailer';

// Create transporter with environment variables
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }
});

// Email Templates
const templates = {
    welcome: (name) => ({
        subject: 'Welcome to Scoopify Club! 🎉',
        html: `
            <h1>Welcome to Scoopify Club, ${name}!</h1>
            <p>We're excited to have you on board. Here's what you can do next:</p>
            <ul>
                <li>Complete your profile</li>
                <li>Schedule your first service</li>
                <li>Explore our service areas</li>
            </ul>
            <p>If you have any questions, feel free to reply to this email.</p>
        `
    }),
    
    serviceScheduled: (service) => ({
        subject: 'Service Scheduled Successfully ✅',
        html: `
            <h1>Your Service is Scheduled!</h1>
            <p>Your service has been scheduled for: <strong>${new Date(service.scheduledDate).toLocaleString()}</strong></p>
            <p>Service Details:</p>
            <ul>
                <li>Service Type: ${service.servicePlan?.name || 'Standard Service'}</li>
                <li>Duration: ${service.servicePlan?.duration || 30} minutes</li>
                ${service.employee ? `<li>Assigned Scooper: ${service.employee.user.name}</li>` : ''}
            </ul>
            <p>We'll notify you when the scooper is on their way!</p>
        `
    }),

    serviceCompleted: (service) => ({
        subject: 'Service Completed 🎉',
        html: `
            <h1>Service Completed!</h1>
            <p>Your service has been completed on: <strong>${new Date(service.completedDate).toLocaleString()}</strong></p>
            <p>Thank you for choosing Scoopify Club!</p>
            <p>If you have any feedback, please let us know.</p>
        `
    }),

    paymentConfirmation: (payment) => ({
        subject: 'Payment Confirmation 💰',
        html: `
            <h1>Payment Confirmation</h1>
            <p>We've received your payment of <strong>$${payment.amount.toFixed(2)}</strong></p>
            <p>Payment Details:</p>
            <ul>
                <li>Payment ID: ${payment.id}</li>
                <li>Date: ${new Date(payment.createdAt).toLocaleString()}</li>
                <li>Method: ${payment.paymentMethod}</li>
            </ul>
            <p>Thank you for your business!</p>
        `
    }),

    passwordReset: (token) => ({
        subject: 'Password Reset Request 🔐',
        html: `
            <h1>Password Reset Request</h1>
            <p>You requested to reset your password. Click the link below to proceed:</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}">Reset Password</a></p>
            <p>If you didn't request this, please ignore this email.</p>
            <p>This link will expire in 1 hour.</p>
        `
    })
};

// Main send function
export async function sendEmail({ to, template, data }) {
    try {
        const { subject, html } = templates[template](data);
        
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to,
            subject,
            html
        });

        console.log('Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Failed to send email:', error);
        return { success: false, error: error.message };
    }
}

// Verify email configuration
export async function verifyEmailConfig() {
    try {
        await transporter.verify();
        return { success: true };
    } catch (error) {
        console.error('Email configuration error:', error);
        return { success: false, error: error.message };
    }
}

export async function sendServiceNotificationEmail(email, serviceId, notificationType, serviceDetails) {
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
            html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Service Completed</h2>
                    <p>Your service at ${serviceDetails.address} has been completed.</p>
                    <p>Service ID: ${serviceId}</p>
                    ${serviceDetails.notes ? `<p>Notes: ${serviceDetails.notes}</p>` : ''}
                    <p>Best regards,<br>Scoopify Club Team</p>
                </div>
            `;
            break;
            
        case 'scheduled':
            html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">New Service Scheduled</h2>
                    <p>A new service has been scheduled for ${serviceDetails.date} at ${serviceDetails.address}.</p>
                    <p>Service ID: ${serviceId}</p>
                    <p>If you need to reschedule, please contact our support team.</p>
                    <p>Best regards,<br>Scoopify Club Team</p>
                </div>
            `;
            break;
    }

    return sendEmail({
        to: email,
        template: 'custom',
        data: { subject, html }
    });
}

// Add custom template for notifications
templates.custom = (data) => ({
    subject: data.subject,
    html: data.html
});

export const sendAdminNotification = async (subject, message) => {
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

export async function sendPaymentFailedEmail(customerEmail, customerName, retryDate) {
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
    }
    catch (error) {
        console.error('Error sending payment failed emails:', error);
    }
}

export async function sendPaymentRetryEmail(customerEmail, customerName) {
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
    }
    catch (error) {
        console.error('Error sending payment retry email:', error);
    }
}
