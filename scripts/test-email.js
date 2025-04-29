const nodemailer = require('nodemailer');
require('dotenv').config();

async function main() {
    console.log('🔍 Testing email configuration...\n');

    try {
        // Create transporter with Namecheap settings
        const transporter = nodemailer.createTransport({
            host: 'mail.privateemail.com',
            port: 465, // Using 465 for secure SMTP
            secure: true, // Using SSL/TLS
            auth: {
                user: 'services@scoopify.club',
                pass: 'RnCbH9@Y7d$eVc'
            },
            tls: {
                // Do not fail on invalid certs
                rejectUnauthorized: false
            }
        });

        console.log('📧 Testing connection to email server...');
        await transporter.verify();
        console.log('✅ Email server connection successful!\n');

        console.log('📧 Sending test email...');
        const info = await transporter.sendMail({
            from: 'Scoopify Club <services@scoopify.club>',
            to: 'services@scoopify.club',
            subject: 'Test Email from Scoopify Club',
            text: 'If you receive this email, your email configuration is working correctly!',
            html: '<h1>Email Configuration Test</h1><p>If you receive this email, your email configuration is working correctly!</p>'
        });

        console.log('✅ Test email sent successfully!');
        console.log('📨 Message ID:', info.messageId);
        console.log('\nCheck your inbox to confirm receipt of the test email.');

    } catch (error) {
        console.error('❌ Email configuration test failed:', error.message);
        console.error('\nFull error:', error);
        if (error.code === 'EAUTH') {
            console.error('\nAuthentication failed. Please check your credentials.');
        }
        process.exit(1);
    }
}

main(); 