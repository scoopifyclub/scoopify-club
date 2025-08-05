import { NextResponse } from 'next/server';
import emailService from '@/lib/email-service';

export async function POST(request) {
  try {
    const { to, template, data } = await request.json();

    // Validate input
    if (!to || !template) {
      return NextResponse.json({ 
        error: 'Email address and template are required' 
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json({ 
        error: 'Invalid email format' 
      }, { status: 400 });
    }

    // Send test email
    const result = await emailService.sendEmail({
      to,
      template,
      data: data || {}
    });

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      result
    });

  } catch (error) {
    console.error('Email test failed:', error);
    return NextResponse.json({
      error: 'Failed to send test email',
      details: error.message
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Test email configuration
    const configValid = await emailService.verifyConfig();
    
    return NextResponse.json({
      success: true,
      configValid,
      providers: {
        smtp: !!process.env.SMTP_HOST,
        resend: !!process.env.RESEND_API_KEY
      },
      primaryProvider: process.env.EMAIL_PROVIDER || 'smtp'
    });

  } catch (error) {
    console.error('Email config test failed:', error);
    return NextResponse.json({
      error: 'Failed to test email configuration',
      details: error.message
    }, { status: 500 });
  }
} 