import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST() {
  try {
    // Create users table first (base table)
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        password TEXT,
        role TEXT NOT NULL DEFAULT 'CUSTOMER',
        email_verified BOOLEAN DEFAULT false,
        verification_token TEXT UNIQUE,
        verification_token_expiry TIMESTAMP WITH TIME ZONE,
        reset_token TEXT UNIQUE,
        reset_token_expiry TIMESTAMP WITH TIME ZONE,
        image TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create employees table (depends on users)
    await sql`
      CREATE TABLE IF NOT EXISTS employees (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        user_id TEXT UNIQUE REFERENCES users(id),
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create customers table (depends on users)
    await sql`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        email TEXT UNIQUE NOT NULL,
        phone TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        gate_code TEXT,
        service_day TEXT,
        pause_start TIMESTAMP WITH TIME ZONE,
        pause_end TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create addresses table (depends on customers)
    await sql`
      CREATE TABLE IF NOT EXISTS addresses (
        id TEXT PRIMARY KEY,
        street TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        zip_code TEXT NOT NULL,
        customer_id TEXT UNIQUE NOT NULL REFERENCES customers(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create service_areas table (depends on employees)
    await sql`
      CREATE TABLE IF NOT EXISTS service_areas (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        employee_id TEXT NOT NULL REFERENCES employees(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create services table (depends on customers, employees, and service_areas)
    await sql`
      CREATE TABLE IF NOT EXISTS services (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        employee_id TEXT REFERENCES employees(id),
        status TEXT NOT NULL DEFAULT 'SCHEDULED',
        scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
        claimed_at TIMESTAMP WITH TIME ZONE,
        arrived_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        service_area_id TEXT REFERENCES service_areas(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create subscriptions table (depends on customers)
    await sql`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id TEXT PRIMARY KEY,
        customer_id TEXT UNIQUE NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        plan TEXT NOT NULL,
        start_date TIMESTAMP WITH TIME ZONE NOT NULL,
        next_billing TIMESTAMP WITH TIME ZONE NOT NULL,
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        stripe_subscription_id TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create notifications table (depends on users)
    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        read BOOLEAN DEFAULT false,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create referrals table
    await sql`
      CREATE TABLE IF NOT EXISTS referrals (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        referrer_id UUID NOT NULL REFERENCES customers(id),
        referred_id UUID NOT NULL REFERENCES customers(id),
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        paid_at TIMESTAMP WITH TIME ZONE,
        amount DECIMAL(10,2) NOT NULL DEFAULT 5.00,
        cash_app_payment_id VARCHAR(255),
        UNIQUE(referred_id)
      )
    `;

    // Add referral code to customers table
    await sql`
      ALTER TABLE customers
      ADD COLUMN IF NOT EXISTS referral_code VARCHAR(10) UNIQUE,
      ADD COLUMN IF NOT EXISTS cash_app_tag VARCHAR(50)
    `;

    // Create referral_payments table for tracking monthly payments
    await sql`
      CREATE TABLE IF NOT EXISTS referral_payments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        referral_id UUID NOT NULL REFERENCES referrals(id),
        amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        cash_app_payment_id VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    return NextResponse.json({ message: 'Database setup completed successfully' });
  } catch (error) {
    console.error('Error setting up database:', error);
    return NextResponse.json({ error: 'Failed to setup database' }, { status: 500 });
  }
} 