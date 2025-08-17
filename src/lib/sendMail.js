// Simple wrapper for sending emails using nodemailer
import nodemailer from 'nodemailer';

export async function sendMail({ to, subject, html, text }) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'mail.privateemail.com',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true, // true for 465 (SSL), false for 587 (STARTTLS)
    auth: {
      user: process.env.SMTP_USER || 'services@scoopify.club',
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
      ciphers: 'SSLv3'
    },
    authMethod: 'LOGIN'
  });

  console.log('Sending email with config:', {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    user: process.env.SMTP_USER
  });

  return transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER || 'services@scoopify.club',
    to,
    subject,
    html,
    text,
  });
}
