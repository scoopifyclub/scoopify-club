import { NextResponse } from 'next/server';
import { testEmailConnection } from '@/lib/unified-email-service';

export async function GET() {
    try {
        console.log('Testing email connection...');
        
        // Log environment variables for debugging
        console.log('Environment variables:', {
            SMTP_HOST: process.env.SMTP_HOST,
            SMTP_PORT: process.env.SMTP_PORT,
            SMTP_USER: process.env.SMTP_USER,
            SMTP_PASSWORD: process.env.SMTP_PASSWORD ? '***' : 'NOT_SET',
            EMAIL_FROM: process.env.EMAIL_FROM
        });

        const result = await testEmailConnection();
        
        if (result.success) {
            return NextResponse.json({
                success: true,
                message: 'Email connection successful',
                config: {
                    host: process.env.SMTP_HOST,
                    port: process.env.SMTP_PORT,
                    user: process.env.SMTP_USER,
                    from: process.env.EMAIL_FROM
                }
            });
        } else {
            return NextResponse.json({
                success: false,
                error: result.error,
                config: {
                    host: process.env.SMTP_HOST,
                    port: process.env.SMTP_PORT,
                    user: process.env.SMTP_USER
                }
            }, { status: 500 });
        }
    } catch (error) {
        console.error('Error testing email connection:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { to, template, data } = await request.json();
        
        if (!to || !template) {
            return NextResponse.json({
                error: 'Missing required fields: to, template'
            }, { status: 400 });
        }

        // Import the email service dynamically
        const { sendEmail } = await import('@/lib/unified-email-service');
        const result = await sendEmail(to, template, data || {});
        
        return NextResponse.json({
            success: true,
            message: 'Test email sent successfully',
            result: result
        });

    } catch (error) {
        console.error('Test email send error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to send test email',
            details: error.message
        }, { status: 500 });
    }
} 