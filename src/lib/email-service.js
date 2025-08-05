import nodemailer from 'nodemailer';

// Create transporter for Namecheap email
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.NAMECHEAP_SMTP_HOST || 'mail.privateemail.com',
        port: process.env.NAMECHEAP_SMTP_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.NAMECHEAP_EMAIL_USER,
            pass: process.env.NAMECHEAP_EMAIL_PASS
        },
        tls: {
            rejectUnauthorized: false
        }
    });
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
    }
};

// Send email function
export async function sendEmail(to, template, data = {}) {
    try {
        const transporter = createTransporter();
        const emailTemplate = emailTemplates[template];
        
        if (!emailTemplate) {
            throw new Error(`Email template '${template}' not found`);
        }

        const mailOptions = {
            from: process.env.NAMECHEAP_EMAIL_USER,
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
                from: process.env.NAMECHEAP_EMAIL_USER,
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