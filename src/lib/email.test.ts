import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmailSending() {
  try {
    const data = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'delivered@resend.dev',
      subject: 'Test Email',
      html: '<p>This is a test email from Scoopify Club.</p>'
    });

    console.log('✅ Email sent successfully');
    console.log('Email data:', data);
    return true;
  } catch (error) {
    console.error('❌ Email sending failed');
    console.error('Error details:', error);
    return false;
  }
}

// Run the test
testEmailSending(); 