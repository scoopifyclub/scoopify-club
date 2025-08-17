// Create transporter for Namecheap email
const createTransporter = async () => {
    const nodemailer = await import('nodemailer');
    // The method is called createTransport, not createTransporter
    const createTransport = nodemailer.createTransport;
    
    if (!createTransport) {
        throw new Error('createTransport method not found in nodemailer');
    }
    
    const port = Number(process.env.SMTP_PORT) || 465;
    const isSSL = port === 465;
    
    const config = {
        host: process.env.SMTP_HOST || 'mail.privateemail.com',
        port: port,
        secure: isSSL, // true for 465 (SSL), false for 587 (STARTTLS)
        auth: {
            user: process.env.SMTP_USER || 'services@scoopify.club',
            pass: process.env.SMTP_PASSWORD
        },
        tls: {
            rejectUnauthorized: false,
            ciphers: 'SSLv3'
        },
        authMethod: 'LOGIN' // Force LOGIN instead of PLAIN
    };
    
    // For port 587 (STARTTLS), add specific TLS settings
    if (port === 587) {
        config.requireTLS = true;
        config.ignoreTLS = false;
    }

    console.log('Creating unified email transporter with config:', {
        host: config.host,
        port: config.port,
        secure: config.secure,
        user: config.user,
        authMethod: config.authMethod
    });
    
    return createTransport(config);
};

// Email templates for service notifications
const emailTemplates = {
    // Service Status Notifications
    'service-claimed': {
        subject: '🎯 Your service has been claimed by {scooperName}!',
        html: (data) => `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">Great news! Your service has been claimed! 🎉</h1>
                </div>
                
                <div style="padding: 30px;">
                    <p style="font-size: 18px; color: #333;">Hi <strong>${data.customerName}</strong>,</p>
                    <p style="font-size: 16px; color: #555;"><strong>${data.scooperName}</strong> has claimed your dog waste removal service and will be arriving soon!</p>
                    
                    ${data.scooperPhoto ? `
                        <div style="text-align: center; margin: 30px 0;">
                            <img src="${data.scooperPhoto}" alt="${data.scooperName}" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 4px solid #667eea;">
                            <p style="font-size: 18px; font-weight: bold; color: #333; margin-top: 15px;">${data.scooperName}</p>
                        </div>
                    ` : ''}
                    
                    <div style="background-color: #f8f9fa; padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #667eea;">
                        <h3 style="color: #333; margin-top: 0;">Service Details</h3>
                        <ul style="color: #555; line-height: 1.6;">
                            <li><strong>Service:</strong> ${data.serviceType}</li>
                            <li><strong>Scheduled Date:</strong> ${data.serviceDate}</li>
                            <li><strong>Scheduled Time:</strong> ${data.serviceTime}</li>
                            <li><strong>Duration:</strong> ${data.duration} minutes</li>
                        </ul>
                    </div>
                    
                    <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 25px 0;">
                        <h4 style="color: #1976d2; margin-top: 0;">What happens next?</h4>
                        <ol style="color: #555; line-height: 1.6;">
                            <li>${data.scooperName} will arrive at your scheduled time</li>
                            <li>You'll receive a notification when they arrive</li>
                            <li>They'll complete the service and take before/after photos</li>
                            <li>You'll get a completion notification with photos</li>
                        </ol>
                    </div>
                    
                    <p style="font-size: 16px; color: #555;">You can track the service status in real-time from your dashboard!</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${data.dashboardUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">View Dashboard</a>
                    </div>
                    
                    <p style="font-size: 16px; color: #555;">Thank you for choosing ScoopifyClub!</p>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6;">
                    <p style="color: #6c757d; margin: 0; font-size: 14px;">© 2025 ScoopifyClub. All rights reserved.</p>
                </div>
            </div>
        `
    },
    
    'scooper-arrived': {
        subject: '🚗 {scooperName} has arrived for your service!',
        html: (data) => `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <div style="background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">Your scooper has arrived! 🎉</h1>
                </div>
                
                <div style="padding: 30px;">
                    <p style="font-size: 18px; color: #333;">Hi <strong>${data.customerName}</strong>,</p>
                    <p style="font-size: 16px; color: #555;"><strong>${data.scooperName}</strong> has arrived at your location and is ready to begin your dog waste removal service.</p>
                    
                    ${data.scooperPhoto ? `
                        <div style="text-align: center; margin: 30px 0;">
                            <img src="${data.scooperPhoto}" alt="${data.scooperName}" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 4px solid #4caf50;">
                            <p style="font-size: 18px; font-weight: bold; color: #333; margin-top: 15px;">${data.scooperName}</p>
                        </div>
                    ` : ''}
                    
                    <div style="background-color: #f8f9fa; padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #4caf50;">
                        <h3 style="color: #333; margin-top: 0;">Service Details</h3>
                        <ul style="color: #555; line-height: 1.6;">
                            <li><strong>Service:</strong> ${data.serviceType}</li>
                            <li><strong>Date:</strong> ${data.serviceDate}</li>
                            <li><strong>Time:</strong> ${data.serviceTime}</li>
                        </ul>
                    </div>
                    
                    <p style="font-size: 16px; color: #555;">Your service is now in progress. You'll receive another notification when it's completed!</p>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6;">
                    <p style="color: #6c757d; margin: 0; font-size: 14px;">© 2025 ScoopifyClub. All rights reserved.</p>
                </div>
            </div>
        `
    },
    
    'service-completed': {
        subject: '✅ Your service is complete! Check out the results and rate your experience',
        html: (data) => `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">Service Complete! 🎉</h1>
                </div>
                
                <div style="padding: 30px;">
                    <p style="font-size: 18px; color: #333;">Hi <strong>${data.customerName}</strong>,</p>
                    <p style="font-size: 16px; color: #555;">Great news! Your service with <strong>${data.employeeName}</strong> has been completed successfully.</p>
                    
                    <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 20px 0;">
                        <h3 style="color: #0c4a6e; margin-top: 0;">Service Details</h3>
                        <p style="margin: 8px 0;"><strong>Service:</strong> ${data.servicePlanName}</p>
                        <p style="margin: 8px 0;"><strong>Date:</strong> ${data.serviceDate}</p>
                        <p style="margin: 8px 0;"><strong>Scooper:</strong> ${data.employeeName}</p>
                    </div>
                    
                    <div style="background-color: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
                        <h3 style="color: #065f46; margin-top: 0;">⭐ Rate Your Experience</h3>
                        <p style="color: #065f46; margin: 8px 0;">Help us improve and help other customers choose great scoopers by rating your service!</p>
                        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/services/rate?serviceId=${data.serviceId}" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Rate Your Service</a>
                    </div>
                    
                    <div style="background-color: #fef2f2; border: 1px solid #ef4444; border-radius: 8px; padding: 20px; margin: 20px 0;">
                        <h3 style="color: #991b1b; margin-top: 0;">💝 Show Your Appreciation</h3>
                        <p style="color: #991b1b; margin: 8px 0;">If you're happy with the service, consider leaving a tip for ${data.employeeName}!</p>
                        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/services" style="display: inline-block; background-color: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">Leave a Tip</a>
                    </div>
                    
                    <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
                        <h3 style="color: #92400e; margin-top: 0;">📸 Photos Available</h3>
                        <p style="color: #92400e; margin: 8px 0;">Before and after photos from your service are now available in your dashboard.</p>
                        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/services" style="display: inline-block; background-color: #f59e0b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Photos</a>
                    </div>
                    
                    <p style="font-size: 16px; color: #555;">Thank you for choosing ScoopifyClub! We appreciate your business.</p>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Go to Dashboard</a>
                    </div>
                </div>
                
                <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="color: #64748b; font-size: 14px; margin: 0;">Questions? Contact us at support@scoopify.club</p>
                </div>
            </div>
        `
    },
    
    'tip-received': {
        subject: '💝 You received a ${amount} tip from {customerName}!',
        html: (data) => `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <div style="background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">You received a tip! 🎉</h1>
                </div>
                
                <div style="padding: 30px;">
                    <p style="font-size: 18px; color: #333;">Hi <strong>${data.employeeName}</strong>,</p>
                    <p style="font-size: 16px; color: #555;"><strong>${data.customerName}</strong> has left <strong>$${data.amount}</strong> tip for your excellent service!</p>
                    
                    <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                        <h2 style="color: #856404; margin: 0; font-size: 24px;">$${data.amount}</h2>
                        <p style="color: #856404; margin: 8px 0; font-size: 18px;">Tip Received!</p>
                    </div>
                    
                    <p style="font-size: 16px; color: #555;">This tip will be processed and added to your earnings. Keep up the great work!</p>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="${process.env.NEXT_PUBLIC_APP_URL}/employee/dashboard" style="display: inline-block; background-color: #ff9800; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Dashboard</a>
                    </div>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6;">
                    <p style="color: #6c757d; margin: 0; font-size: 14px;">© 2025 ScoopifyClub. All rights reserved.</p>
                </div>
            </div>
        `
    },

    'rating-received': {
        subject: '⭐ You received a ${rating}/5 rating from {customerName}!',
        html: (data) => `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <div style="background: linear-gradient(135deg, #ffd700 0%, #ffb300 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">New Rating Received! ⭐</h1>
                </div>
                
                <div style="padding: 30px;">
                    <p style="font-size: 18px; color: #333;">Hi <strong>${data.employeeName}</strong>,</p>
                    <p style="font-size: 16px; color: #555;"><strong>${data.customerName}</strong> has rated your service!</p>
                    
                    <div style="background-color: #fff8e1; border: 1px solid #ffecb3; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                        <div style="font-size: 32px; margin-bottom: 10px;">
                            ${'⭐'.repeat(data.rating)}${'☆'.repeat(5 - data.rating)}
                        </div>
                        <h2 style="color: #f57f17; margin: 0; font-size: 24px;">${data.rating}/5 Stars</h2>
                        <p style="color: #f57f17; margin: 8px 0; font-size: 18px;">
                            ${data.rating === 5 ? 'Excellent!' : 
                              data.rating === 4 ? 'Very Good!' : 
                              data.rating === 3 ? 'Good!' : 
                              data.rating === 2 ? 'Fair' : 'Poor'}
                        </p>
                    </div>
                    
                    ${data.feedback ? `
                        <div style="background-color: #f3f4f6; border: 1px solid #d1d5db; border-radius: 8px; padding: 20px; margin: 20px 0;">
                            <h3 style="color: #374151; margin-top: 0;">Customer Feedback</h3>
                            <p style="color: #6b7280; font-style: italic; margin: 0;">"${data.feedback}"</p>
                        </div>
                    ` : ''}
                    
                    <div style="background-color: #e8f5e8; border: 1px solid #4caf50; border-radius: 8px; padding: 20px; margin: 20px 0;">
                        <h3 style="color: #2e7d32; margin-top: 0;">Your Updated Stats</h3>
                        <p style="color: #2e7d32; margin: 8px 0;"><strong>New Average Rating:</strong> ${data.newAverageRating}/5</p>
                        <p style="color: #2e7d32; margin: 8px 0;"><strong>Total Completed Jobs:</strong> ${data.totalJobs}</p>
                    </div>
                    
                    <p style="font-size: 16px; color: #555;">Great ratings help you get more jobs and build trust with customers. Keep up the excellent work!</p>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="${process.env.NEXT_PUBLIC_APP_URL}/employee/dashboard" style="display: inline-block; background-color: #ffd700; color: #333; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Dashboard</a>
                    </div>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6;">
                    <p style="color: #6c757d; margin: 0; font-size: 14px;">© 2025 ScoopifyClub. All rights reserved.</p>
                </div>
            </div>
        `
    },

    'service-reminder': {
        subject: '📅 Service Reminder: Your ScoopifyClub service is tomorrow!',
        html: (data) => `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <div style="background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">Service Reminder 📅</h1>
                </div>
                
                <div style="padding: 30px;">
                    <p style="font-size: 18px; color: #333;">Hi <strong>${data.customerName}</strong>,</p>
                    <p style="font-size: 16px; color: #555;">This is a friendly reminder that your ScoopifyClub service is scheduled for <strong>tomorrow</strong>!</p>
                    
                    <div style="background-color: #e3f2fd; padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #2196f3;">
                        <h3 style="color: #1976d2; margin-top: 0;">Service Details</h3>
                        <ul style="color: #555; line-height: 1.6;">
                            <li><strong>Service Type:</strong> ${data.serviceType}</li>
                            <li><strong>Date:</strong> ${data.serviceDate}</li>
                            <li><strong>Time:</strong> ${data.serviceTime}</li>
                            <li><strong>Address:</strong> ${data.address}</li>
                            <li><strong>Credits Used:</strong> ${data.creditsUsed}</li>
                        </ul>
                    </div>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
                        <h4 style="color: #333; margin-top: 0;">📋 Preparation Checklist</h4>
                        <ul style="color: #555; line-height: 1.6;">
                            <li>Ensure your yard is accessible</li>
                            <li>Remove any obstacles or hazards</li>
                            <li>Keep pets indoors during service</li>
                            <li>Have gate codes ready if needed</li>
                        </ul>
                    </div>
                    
                    <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #4caf50;">
                        <h4 style="color: #2e7d32; margin-top: 0;">🔄 Need to Reschedule?</h4>
                        <p style="color: #555; margin-bottom: 15px;">You can reschedule your service up to 3 days in advance from your dashboard.</p>
                        <div style="text-align: center;">
                            <a href="${data.dashboardUrl}" style="background: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Manage Service</a>
                        </div>
                    </div>
                    
                    <p style="font-size: 16px; color: #555;">You'll receive real-time updates when your scooper arrives and completes the service!</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${data.dashboardUrl}" style="background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">View Dashboard</a>
                    </div>
                    
                    <p style="font-size: 16px; color: #555;">Thank you for choosing ScoopifyClub!</p>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6;">
                    <p style="color: #6c757d; margin: 0; font-size: 14px;">© 2025 ScoopifyClub. All rights reserved.</p>
                </div>
            </div>
        `
    }
};

// Main email sending function
export async function sendEmail(to, template, data = {}) {
    try {
        const transporter = await createTransporter();
        const emailTemplate = emailTemplates[template];
        
        if (!emailTemplate) {
            throw new Error(`Email template '${template}' not found`);
        }

        // Replace template variables in subject
        let subject = emailTemplate.subject;
        Object.keys(data).forEach(key => {
            const regex = new RegExp(`{${key}}`, 'g');
            subject = subject.replace(regex, data[key]);
        });

        const mailOptions = {
            from: process.env.EMAIL_FROM || 'Scoopify Club <services@scoopify.club>',
            to: to,
            subject: subject,
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

// Service notification functions
export async function sendServiceClaimedNotification(service, scooper) {
    try {
        const data = {
            customerName: service.customer.user.name,
            scooperName: scooper.user.name,
            scooperPhoto: scooper.user.image,
            serviceType: service.servicePlan.name,
            serviceDate: new Date(service.scheduledDate).toLocaleDateString(),
            serviceTime: new Date(service.scheduledDate).toLocaleTimeString(),
            duration: service.servicePlan.duration,
            dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/services`
        };

        await sendEmail(service.customer.user.email, 'service-claimed', data);
        return { success: true };
    } catch (error) {
        console.error('Error sending service claimed notification:', error);
        return { success: false, error: error.message };
    }
}

export async function sendScooperArrivedNotification(service, scooper) {
    try {
        const data = {
            customerName: service.customer.user.name,
            scooperName: scooper.user.name,
            scooperPhoto: scooper.user.image,
            serviceType: service.servicePlan.name,
            serviceDate: new Date(service.scheduledDate).toLocaleDateString(),
            serviceTime: new Date(service.scheduledDate).toLocaleTimeString()
        };

        await sendEmail(service.customer.user.email, 'scooper-arrived', data);
        return { success: true };
    } catch (error) {
        console.error('Error sending scooper arrived notification:', error);
        return { success: false, error: error.message };
    }
}

export async function sendServiceCompletedNotification(service, scooper) {
    try {
        const data = {
            customerName: service.customer.user.name,
            scooperName: scooper.user.name,
            scooperPhoto: scooper.user.image,
            serviceType: service.servicePlan.name,
            completedDate: new Date().toLocaleDateString(),
            amount: service.servicePlan.price,
            hasPhotos: service.afterPhotoIds && service.afterPhotoIds.length > 0,
            tipUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/services/${service.id}/tip`
        };

        await sendEmail(service.customer.user.email, 'service-completed', data);
        return { success: true };
    } catch (error) {
        console.error('Error sending service completed notification:', error);
        return { success: false, error: error.message };
    }
}

export async function sendTipNotification(service, tip, tipData) {
    try {
        const data = {
            employeeName: service.employee.user.name,
            customerName: service.customer.user.name,
            amount: tip.amount,
            processingFee: tip.processingFee.toFixed(2),
            netAmount: tip.netAmount.toFixed(2),
            message: tipData.message,
            serviceDate: new Date(service.scheduledDate).toLocaleDateString(),
            tipId: tip.id
        };

        await sendEmail(service.employee.user.email, 'tip-received', data);
        return { success: true };
    } catch (error) {
        console.error('Error sending tip notification:', error);
        return { success: false, error: error.message };
    }
}

// Test email function
export async function testEmailConnection() {
    try {
        const transporter = await createTransporter();
        await transporter.verify();
        console.log('Email connection verified successfully');
        return { success: true };
    } catch (error) {
        console.error('Email connection failed:', error);
        return { success: false, error: error.message };
    }
}

// Helper functions for customer dashboard email notifications
export async function sendServiceClaimedEmail(service, scooper) {
    try {
        const data = {
            customerName: service.customer.user.name,
            scooperName: scooper.user.name,
            scooperPhoto: scooper.user.image,
            serviceType: service.servicePlan.name,
            scheduledDate: service.scheduledDate,
            serviceId: service.id
        };

        return await sendEmail({
            to: service.customer.user.email,
            template: 'service-claimed',
            data: data
        });
    } catch (error) {
        console.error('Error sending service claimed email:', error);
        return { success: false, error: error.message };
    }
}

export async function sendScooperArrivedEmail(service, scooper) {
    try {
        const data = {
            customerName: service.customer.user.name,
            scooperName: scooper.user.name,
            serviceType: service.servicePlan.name,
            scheduledDate: service.scheduledDate,
            serviceId: service.id
        };

        return await sendEmail({
            to: service.customer.user.email,
            template: 'scooper-arrived',
            data: data
        });
    } catch (error) {
        console.error('Error sending scooper arrived email:', error);
        return { success: false, error: error.message };
    }
}

export async function sendServiceCompletedEmail(service, scooper) {
    try {
        const data = {
            customerName: service.customer.user.name,
            employeeName: scooper.user.name,
            servicePlanName: service.servicePlan.name,
            serviceDate: new Date(service.completedDate).toLocaleDateString(),
            serviceId: service.id
        };

        return await sendEmail({
            to: service.customer.user.email,
            template: 'service-completed',
            data: data
        });
    } catch (error) {
        console.error('Error sending service completed email:', error);
        return { success: false, error: error.message };
    }
}

export async function sendServiceReminderEmail(service, customer) {
    try {
        const data = {
            customerName: customer.user.name,
            serviceType: service.servicePlan.name,
            scheduledDate: new Date(service.scheduledDate).toLocaleDateString(),
            serviceId: service.id
        };

        return await sendEmail({
            to: customer.user.email,
            template: 'service-reminder',
            data: data
        });
    } catch (error) {
        console.error('Error sending service reminder email:', error);
        return { success: false, error: error.message };
    }
}

export async function sendRatingNotificationEmail(rating) {
    try {
        const data = {
            employeeName: rating.employee.user.name,
            customerName: rating.service.customer.user.name,
            rating: rating.rating,
            feedback: rating.feedback,
            serviceType: rating.service.servicePlan.name,
            newAverageRating: rating.employee.averageRating,
            totalJobs: rating.employee.completedJobs
        };

        return await sendEmail({
            to: rating.employee.user.email,
            template: 'rating-received',
            data: data
        });
    } catch (error) {
        console.error('Error sending rating notification email:', error);
        return { success: false, error: error.message };
    }
}
