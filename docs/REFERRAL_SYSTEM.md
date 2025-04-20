# Referral System Documentation

This document provides detailed information about the referral system in ScoopifyClub, including how it works, the payment distribution model, and how to manage the system.

## Overview

The ScoopifyClub referral system allows customers to earn money by referring new customers to the service. For each active customer they refer, they receive $5 per month as long as the referred customer maintains an active subscription.

## Customer Referral Process

### Referral Code Generation

1. Each customer is automatically assigned a unique 6-character alphanumeric referral code when they create an account
2. If a customer doesn't have a referral code, one is generated when they first access the referrals page
3. The code generation eliminates visually confusing characters (like 0/O, 1/I) for better readability

### Referring New Customers

1. Customers can share their referral code with friends through:
   - Direct link sharing (uses the Web Share API where available)
   - Copy to clipboard functionality
   - The referral link format is: `https://scoopifyclub.com/signup?ref=[REFERRAL_CODE]`

2. When a new user signs up with a referral code:
   - The code is validated against existing customer records
   - If valid, a referral relationship is created in the database
   - The referred customer is linked to the referrer

### Tracking Referrals

1. Customers can see their referrals in the referrals dashboard
2. Information displayed includes:
   - Total number of active referrals
   - Total earnings from referrals
   - Monthly estimated earnings
   - List of referred customers with status (active/inactive)
   - Detailed payment history

## Payment Distribution Model

### Distribution Formula

The ScoopifyClub payment distribution follows this process:

1. **Stripe Processing Fees Deduction**
   - Standard Stripe fee: 2.9% + $0.30 per transaction
   - These fees are deducted first from any payment

2. **Referral Fee Deduction**
   - If the customer was referred, $5 is deducted from the payment
   - This is sent to the referring customer on a monthly basis

3. **Employee/Company Split**
   - After Stripe fees and referral fees, the remaining amount is split:
     - 75% goes to the service provider (scooper)
     - 25% is retained by the company

### Example Calculations

#### Regular Service Payment (No Referral)
```
Service price: $50.00
- Stripe fee: -$1.75 (2.9% + $0.30)
= Remaining amount: $48.25
  - Employee share: $36.19 (75%)
  - Company share: $12.06 (25%)
```

#### Service Payment with Referral
```
Service price: $50.00
- Stripe fee: -$1.75 (2.9% + $0.30)
- Referral fee: -$5.00
= Remaining amount: $43.25
  - Employee share: $32.44 (75%)
  - Company share: $10.81 (25%)
```

## Monthly Referral Payment Processing

### Automated Cron Job

The system includes an automated cron job that processes monthly referral payments:

1. **Execution Schedule**
   - The job runs once per month, typically on the 1st day
   - It's triggered via a secure API endpoint with API key authentication

2. **Process Flow**
   - Identifies all active referrals in the system
   - Verifies that each referred customer has an active subscription
   - Creates a payment record of $5 for the referrer for each active referral
   - Updates the referral statistics and payment history

3. **Implementation**
   - Located in `src/app/api/cron/process-referrals/route.ts`
   - Uses the `processMonthlyReferralPayments` function from `src/lib/payment.ts`
   - Secured by environment variable `CRON_API_KEY`

### Setting Up the Cron Job

To set up the monthly cron job:

1. **On Vercel**
   ```bash
   curl -X POST https://your-domain.com/api/cron/process-referrals \
     -H "x-api-key: YOUR_CRON_API_KEY"
   ```

2. **Using crontab (Linux/Unix)**
   ```
   0 0 1 * * curl -X POST https://your-domain.com/api/cron/process-referrals -H "x-api-key: YOUR_CRON_API_KEY"
   ```

## Database Schema

### Referral Table

```prisma
model Referral {
  id          String    @id @default(cuid())
  referrerId  String    // Customer who referred
  referredId  String    // Customer who was referred
  status      String    @default("ACTIVE") // ACTIVE, INACTIVE, PAID
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  referrer    Customer  @relation("Referrer", fields: [referrerId], references: [id])
  referred    Customer  @relation("Referred", fields: [referredId], references: [id])
  payments    Payment[]
}
```

### Payment Table

```prisma
model Payment {
  id           String    @id @default(cuid())
  amount       Float
  stripeFee    Float?
  status       String    @default("COMPLETED")
  type         String    // SERVICE, REFERRAL, MONTHLY_REFERRAL
  customerId   String?
  referredId   String?
  notes        String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  
  customer     Customer? @relation(fields: [customerId], references: [id])
  referred     User?     @relation("ReferredPayments", fields: [referredId], references: [id])
}
```

## API Endpoints

### Customer Referral Endpoints

1. **Get Referral Code**
   - `GET /api/customer/referral-code`
   - Returns the customer's referral code or generates a new one

2. **Get Referrals**
   - `GET /api/customer/referrals`
   - Returns a list of all customers referred by the current user

3. **Get Referral Payments**
   - `GET /api/customer/referral-payments`
   - Returns a history of all referral payments received

### Admin Endpoints

1. **Process Referral Payments**
   - `POST /api/cron/process-referrals`
   - Manually trigger the monthly referral payment processing
   - Requires admin API key authentication

## Troubleshooting Common Issues

### Missing Referral Payments

If a customer reports missing referral payments:

1. Check if the referred customer has an active subscription
2. Verify that the referral relationship exists in the database
3. Check the payment processing logs for errors
4. Manually trigger the payment process if needed

### Referral Code Issues

If a customer has issues with their referral code:

1. Check if the code exists in the database
2. Generate a new code if needed using the admin dashboard
3. Ensure the customer's account is properly linked to their referrals

## Extending the System

To modify or extend the referral system:

1. **Changing the Referral Amount**
   - Update the value in `src/lib/payment.ts`, in the `processMonthlyReferralPayments` function

2. **Modifying the Payment Distribution**
   - Update the calculation in `src/lib/payment.ts`, in the `calculatePaymentDistribution` function

3. **Adding New Referral Types**
   - Extend the database schema
   - Update the payment processing logic
   - Add new UI components to display the different referral types 