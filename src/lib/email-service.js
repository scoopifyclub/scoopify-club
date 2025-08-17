import nodemailer from 'nodemailer';

// Create transporter for Namecheap Private Email
const createTransporter = () => {
    // Use the correct environment variables from .env.local
    const config = {
        host: process.env.SMTP_HOST || 'mail.privateemail.com',
        port: Number(process.env.SMTP_PORT) || 465,
        secure: true, // true for 465 (SSL), false for 587 (STARTTLS)
        auth: {
            user: process.env.SMTP_USER || 'services@scoopify.club',
            pass: process.env.SMTP_PASSWORD
        },
        tls: {
            rejectUnauthorized: false,
            ciphers: 'SSLv3'
        },
        authMethod: 'LOGIN' // Force LOGIN authentication method
    };

    // For port 587 (STARTTLS), adjust settings
    if (config.port === 587) {
        config.secure = false;
        config.requireTLS = true;
        config.ignoreTLS = false;
    }

    console.log('Creating email transporter with config:', {
        host: config.host,
        port: config.port,
        secure: config.secure,
        user: config.user,
        authMethod: config.authMethod
    });

    return nodemailer.createTransport(config);
};

// Test email connection
export const testEmailConnection = async () => {
    try {
        const transporter = createTransporter();
        await transporter.verify();
        console.log('✅ Email connection verified successfully');
        return { success: true, message: 'Email connection verified' };
    } catch (error) {
        console.error('❌ Email connection failed:', error);
        return { success: false, error: error.message };
    }
};

// Email templates
const emailTemplates = {
    'welcome-customer': {
        subject: 'Welcome to Scoopify Club! 🐕',
        html: (data) => `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #10b981;">Welcome to Scoopify Club!</h2>
                <p>Hi ${data.customerName},</p>
                <p>Thank you for choosing Scoopify Club for your dog waste removal needs! We're excited to have you as part of our community.</p>
                <p><strong>Your first service is scheduled for:</strong> ${data.serviceDate}</p>
                <p>Our professional team will arrive at your scheduled time to keep your yard clean and fresh.</p>
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3>What to expect:</h3>
                    <ul>
                        <li>Professional, reliable service</li>
                        <li>Before and after photos</li>
                        <li>Easy online scheduling</li>
                        <li>Flexible payment options</li>
                    </ul>
                </div>
                <p>If you have any questions, feel free to contact us at support@scoopifyclub.com</p>
                <p>Best regards,<br>The Scoopify Club Team</p>
            </div>
        `
    },
    'service-reminder': {
        subject: 'Service Reminder - Scoopify Club 📅',
        html: (data) => `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #10b981;">Service Reminder</h2>
                <p>Hi ${data.customerName},</p>
                <p>This is a friendly reminder that your Scoopify Club service is scheduled for <strong>${data.serviceDate}</strong>.</p>
                <p>Please ensure your yard is accessible for our team.</p>
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3>Service Details:</h3>
                    <p><strong>Date:</strong> ${data.serviceDate}</p>
                    <p><strong>Time:</strong> ${data.serviceTime}</p>
                    <p><strong>Address:</strong> ${data.address}</p>
                </div>
                <p>Thank you for choosing Scoopify Club!</p>
                <p>Best regards,<br>The Scoopify Club Team</p>
            </div>
        `
    },
    'scooper-assignment': {
        subject: 'New Service Assignment - Scoopify Club 🐕',
        html: (data) => `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #10b981;">New Service Assignment</h2>
                <p>Hi ${data.scooperName},</p>
                <p>You have been assigned a new service for Scoopify Club.</p>
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3>Service Details:</h3>
                    <p><strong>Customer:</strong> ${data.customerName}</p>
                    <p><strong>Date:</strong> ${data.serviceDate}</p>
                    <p><strong>Time:</strong> ${data.serviceTime}</p>
                    <p><strong>Address:</strong> ${data.address}</p>
                    <p><strong>Notes:</strong> ${data.notes || 'None'}</p>
                </div>
                <p>Please arrive on time and complete the service checklist in the app.</p>
                <p>Best regards,<br>The Scoopify Club Team</p>
            </div>
        `
    },
    'referral-payment': {
        subject: '🎉 Referral Payment Processed!',
        html: (data) => `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #10b981;">Referral Payment Processed!</h2>
                <p>Hi ${data.referrerName},</p>
                <p>Great news! Your referral payment has been processed successfully.</p>
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3>Payment Details:</h3>
                    <p><strong>Referred Customer:</strong> ${data.referredName}</p>
                    <p><strong>Amount:</strong> $${data.amount}</p>
                    <p><strong>Transfer ID:</strong> ${data.transferId}</p>
                    <p><strong>Type:</strong> ${data.type} Referral</p>
                </div>
                <p>The payment has been sent to your Stripe account and should appear within 1-2 business days.</p>
                <p>Keep referring customers to earn more commissions!</p>
                <p>Best regards,<br>The Scoopify Club Team</p>
            </div>
        `
    },
    'referral-invitation': {
        subject: 'Join Scoopify Club - Referred by a Friend! 🐕',
        html: (data) => `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #10b981;">You've Been Referred to Scoopify Club!</h2>
                <p>Hi ${data.referredName},</p>
                <p>Your friend ${data.referrerName} thinks you'd love Scoopify Club's professional dog waste removal service!</p>
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3>Special Offer:</h3>
                    <p><strong>20% off your first month!</strong></p>
                    <p>Use referral code: <strong>${data.referralCode}</strong></p>
                </div>
                <p>Join thousands of happy customers who enjoy a clean yard without the hassle.</p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/signup?ref=${data.referralCode}" 
                   style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Get Started Today
                </a>
                <p>Best regards,<br>The Scoopify Club Team</p>
            </div>
        `
    },
    'password-reset': {
        subject: 'Reset Your Password - Scoopify Club 🔐',
        html: (data) => `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #10b981;">Reset Your Password</h2>
                <p>Hi ${data.userName},</p>
                <p>We received a request to reset your password for your Scoopify Club account.</p>
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3>Reset Your Password:</h3>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${data.resetToken}" 
                       style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                        Reset Password
                    </a>
                </div>
                <p><strong>This link will expire in 1 hour.</strong></p>
                <p>If you didn't request this password reset, please ignore this email.</p>
                <p>Best regards,<br>The Scoopify Club Team</p>
            </div>
        `
    },
    'email-verification': {
        subject: 'Verify Your Email Address - Scoopify Club',
        html: (data) => `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #10b981;">Verify Your Email Address</h2>
                <p>Hi ${data.userName},</p>
                <p>Please click the button below to verify your email address:</p>
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3>Verify Email Address:</h3>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${data.token}&email=${data.email}" 
                       style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                        Verify Email Address
                    </a>
                </div>
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <p>${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${data.token}&email=${data.email}</p>
                <p><strong>This link will expire in 24 hours.</strong></p>
                <p>Best regards,<br>The Scoopify Club Team</p>
            </div>
        `
    },
    'custom': {
        subject: (data) => data.subject,
        html: (data) => data.html
    }
};

// Send password reset email
export async function sendPasswordResetEmail(email, userName, resetToken) {
    return await sendEmail(email, 'password-reset', {
        userName,
        resetToken
    });
}

// Send email verification
export async function sendVerificationEmail(email, userName, token) {
    return await sendEmail(email, 'email-verification', {
        userName,
        token,
        email
    });
}

// Send service notification email
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

    return await sendEmail(email, 'custom', { subject, html });
}

// Send business signup email
export async function sendBusinessSignupEmail({
    to,
    businessName,
    contactFirstName,
    contactLastName,
    phone,
    payoutMethod,
    stripeAccountId,
    cashAppUsername,
    code,
}) {
    const subject = 'Welcome to Scoopify Club Business Partner Program!';
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome, ${businessName}!</h2>
            <p>Thank you for signing up as a business partner. Here are your details for your records:</p>
            <ul>
                <li><strong>Business Name:</strong> ${businessName}</li>
                <li><strong>Contact Name:</strong> ${contactFirstName} ${contactLastName}</li>
                <li><strong>Phone:</strong> ${phone}</li>
                <li><strong>Email:</strong> ${to}</li>
                <li><strong>Payout Method:</strong> ${payoutMethod === 'STRIPE' ? 'Stripe' : 'Cash App'}</li>
                ${payoutMethod === 'STRIPE' ? `<li><strong>Stripe Account ID:</strong> ${stripeAccountId}</li>` : ''}
                ${payoutMethod === 'CASH_APP' ? `<li><strong>Cash App Username:</strong> ${cashAppUsername}</li>` : ''}
                <li><strong>Referral Code:</strong> <span style="font-size: 1.2em; color: #1d4ed8;">${code}</span></li>
            </ul>
            <p>Share your referral code with clients and start earning rewards!</p>
            <p>If you have questions, reply to this email or contact support@scoopify.com.</p>
            <p>Best regards,<br>Scoopify Club Team</p>
        </div>
    `;
    return await sendEmail(to, 'custom', { subject, html });
}

// Send admin notification
export async function sendAdminNotification(subject, message) {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@scoopifyclub.com';
    return await sendEmail(adminEmail, 'custom', {
        subject,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Admin Notification</h2>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Message:</strong></p>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px;">
                    ${message}
                </div>
                <p>Best regards,<br>Scoopify Club System</p>
            </div>
        `
    });
}

// Send payment failed email
export async function sendPaymentFailedEmail(customerEmail, customerName, retryDate) {
    return await sendEmail(customerEmail, 'custom', {
        subject: 'Payment Failed - Action Required',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #dc2626;">Payment Failed</h2>
                <p>Hi ${customerName},</p>
                <p>We were unable to process your recent payment. Please update your payment method to continue your service.</p>
                <p><strong>Next retry date:</strong> ${retryDate}</p>
                <p>To update your payment method, please log into your account or contact our support team.</p>
                <p>Best regards,<br>Scoopify Club Team</p>
            </div>
        `
    });
}

// Send customer at risk email
export async function sendCustomerAtRiskEmail(customerEmail, customerName, zipCode) {
    return await sendEmail(customerEmail, 'custom', {
        subject: 'Heads up: Possible Service Delay',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Service Update</h2>
                <p>Hello ${customerName},</p>
                <p>We wanted to let you know that due to high demand in your area (zip code ${zipCode}), your service may experience a slight delay this week.</p>
                <p>We're actively recruiting more team members to meet the needs of your neighborhood. If you know anyone who might be interested in joining Scoopify Club as a scooper, please have them apply at <a href="${process.env.NEXT_PUBLIC_APP_URL}/apply">${process.env.NEXT_PUBLIC_APP_URL}/apply</a>.</p>
                <p>We appreciate your patience and your support as we grow!</p>
                <p>Best regards,<br>Scoopify Club Team</p>
            </div>
        `
    });
}

// Send payment retry email
export async function sendPaymentRetryEmail(customerEmail, customerName) {
    return await sendEmail(customerEmail, 'custom', {
        subject: 'Payment Retry Scheduled',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Payment Retry</h2>
                <p>Hi ${customerName},</p>
                <p>We'll be retrying your payment in the next 24 hours. Please ensure your payment method is up to date.</p>
                <p>If you continue to experience issues, please contact our support team.</p>
                <p>Best regards,<br>Scoopify Club Team</p>
            </div>
        `
    });
}

// Send email function
export async function sendEmail(to, template, data = {}) {
    try {
        const transporter = createTransporter();
        const emailTemplate = emailTemplates[template];
        
        if (!emailTemplate) {
            throw new Error(`Email template '${template}' not found`);
        }

        const mailOptions = {
            from: process.env.SMTP_USER || 'services@scoopify.club', // Use the new SMTP_USER
            to: to,
            subject: emailTemplate.subject,
            html: emailTemplate.html(data)
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', result.messageId);
        return { success: true, messageId: result.messageId };

    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}

// Send bulk emails
export async function sendBulkEmails(emails) {
    const transporter = createTransporter();
    const results = [];

    for (const email of emails) {
        try {
            const emailTemplate = emailTemplates[email.template];
            if (!emailTemplate) {
                results.push({ to: email.to, success: false, error: 'Template not found' });
                continue;
            }

            const mailOptions = {
                from: process.env.SMTP_USER || 'services@scoopify.club', // Use the new SMTP_USER
                to: email.to,
                subject: emailTemplate.subject,
                html: emailTemplate.html(email.data || {})
            };

            const result = await transporter.sendMail(mailOptions);
            results.push({ to: email.to, success: true, messageId: result.messageId });

        } catch (error) {
            console.error(`Error sending email to ${email.to}:`, error);
            results.push({ to: email.to, success: false, error: error.message });
        }
    }

    return results;
}

// Email API endpoint
export async function handleEmailRequest(req) {
    try {
        const { to, template, data, bulk } = req.body;

        if (bulk && Array.isArray(bulk)) {
            const results = await sendBulkEmails(bulk);
            return { success: true, results };
        } else {
            if (!to || !template) {
                return { success: false, error: 'To and template are required' };
            }

            const result = await sendEmail(to, template, data);
            return { success: true, result };
        }

    } catch (error) {
        console.error('Email request error:', error);
        return { success: false, error: error.message };
    }
} 