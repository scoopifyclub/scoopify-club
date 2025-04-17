import { PrismaClient } from '@prisma/client';
import { stripe } from '@/lib/stripe';
import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

async function verifyDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function verifyStripe() {
  try {
    const customers = await stripe.customers.list({ limit: 1 });
    console.log('✅ Stripe connection successful');
    return true;
  } catch (error) {
    console.error('❌ Stripe connection failed:', error);
    return false;
  }
}

async function verifyGoogleMaps() {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();
    if (data.status === 'OK') {
      console.log('✅ Google Maps API connection successful');
      return true;
    }
    throw new Error(data.status);
  } catch (error) {
    console.error('❌ Google Maps API connection failed:', error);
    return false;
  }
}

async function verifyEmail() {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    await transporter.verify();
    console.log('✅ Email configuration successful');
    return true;
  } catch (error) {
    console.error('❌ Email configuration failed:', error);
    return false;
  }
}

async function verifyJWT() {
  try {
    const token = jwt.sign({ test: 'test' }, process.env.JWT_SECRET!);
    jwt.verify(token, process.env.JWT_SECRET!);
    console.log('✅ JWT configuration successful');
    return true;
  } catch (error) {
    console.error('❌ JWT configuration failed:', error);
    return false;
  }
}

async function main() {
  console.log('🔍 Verifying API configurations...\n');

  const results = await Promise.all([
    verifyDatabase(),
    verifyStripe(),
    verifyGoogleMaps(),
    verifyEmail(),
    verifyJWT(),
  ]);

  const allSuccessful = results.every((result) => result);

  console.log('\n📊 Summary:');
  console.log(allSuccessful ? '✅ All configurations verified successfully!' : '❌ Some configurations failed verification');

  process.exit(allSuccessful ? 0 : 1);
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
}); 