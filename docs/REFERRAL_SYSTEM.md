# Referral System Documentation

This document provides detailed information about the referral system in ScoopifyClub, including how it works, the payment distribution model, and how to manage the system.

## Overview

The ScoopifyClub referral system allows **customers and business partners** to earn money by referring new customers to the service. For each active customer they refer, referrers receive **$5 per month** as long as the referred customer maintains an active subscription.

## Referral Types

### 1. Customer Referrals
- **Who**: Existing Scoopify Club customers
- **Commission**: $5/month per active referral
- **Payout**: $4.55/month after Stripe fees
- **Model**: Residual income (ongoing monthly payments)

### 2. Business Referrals
- **Who**: Lawn care companies, landscapers, property managers, and other home service businesses
- **Commission**: $5/month per active referral
- **Payout**: $4.55/month after Stripe fees
- **Model**: Residual income (ongoing monthly payments)
- **Commission**: $5/month per active referral (residual model)

## Business Partnership Program

### Target Businesses
- **Lawn Care Companies**: Keep yards clean between mowing visits
- **Landscapers**: Maintain beautiful outdoor spaces
- **Property Managers**: Keep rental properties clean and safe
- **Home Service Providers**: Expand service offerings

### Benefits for Business Partners
- **Expand Service Portfolio**: Add dog waste removal to existing services
- **Customer Retention**: Help customers maintain clean yards between visits
- **Residual Income**: Earn $5/month per active referral
- **Professional Service**: Scoopify Club handles everything (scheduling, service, billing, support)

### How Business Referrals Work
1. **Sign Up**: Business partners complete the business signup form
2. **Get Referral Code**: Receive unique referral code for their business
3. **Share with Customers**: Offer dog waste removal to existing customers
4. **Earn Commissions**: Get $5/month for every active customer referred
5. **Monthly Payouts**: Automatic payments to Stripe or Cash App accounts

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
   - This is sent to the referring customer or business partner on a monthly basis

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

#### Service Payment with Customer Referral
```
Service price: $50.00
- Stripe fee: -$1.75 (2.9% + $0.30)
- Referral fee: -$5.00
= Remaining amount: $43.25
  - Employee share: $32.44 (75%)
  - Company share: $10.81 (25%)
```

#### Service Payment with Business Referral
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
   ```bash
   # Run on the 1st of every month at 9 AM
   0 9 1 * * curl -X POST https://your-domain.com/api/cron/process-referrals \
     -H "x-api-key: YOUR_CRON_API_KEY"
   ```

## Referral Management

### Admin Functions

1. **View All Referrals**
   - Access referral dashboard to see all customer and business referrals
   - Filter by status, type, and date range

2. **Process Referral Payments**
   - Manually trigger referral payment processing
   - Review and approve referral credits

3. **Monitor Referral Performance**
   - Track conversion rates
   - Analyze referral sources
   - Generate referral reports

### Referral Status Tracking

- **PENDING**: New referral created, waiting for customer to sign up
- **ACTIVE**: Customer has signed up and is using the service
- **PROCESSED**: Referral payment has been processed
- **INACTIVE**: Customer has cancelled or referral has expired

## Security and Validation

### Referral Code Validation

1. **Unique Codes**: Each referral code is unique and cannot be duplicated
2. **Code Expiration**: Referral codes can be set to expire after a certain time
3. **Usage Limits**: Prevent abuse by limiting referral code usage per referrer

### Payment Security

1. **Stripe Integration**: All referral payments are processed through Stripe
2. **Audit Trail**: Complete logging of all referral activities and payments
3. **Fraud Prevention**: Monitor for suspicious referral patterns

## Best Practices

### For Customers
- Share referral codes with friends and family
- Use social media to promote your referral code
- Offer to help new customers get started

### For Business Partners
- Integrate dog waste removal into your service offerings
- Train your team to mention the service to customers
- Use your referral code in marketing materials

### For Administrators
- Regularly review referral performance
- Monitor for fraudulent referrals
- Provide support to referrers and referred customers

## Support and Contact

For questions about the referral system:
- **Email**: support@scoopifyclub.com
- **Documentation**: This document and related API docs
- **Admin Panel**: Use the referral management dashboard

---

*Last updated: [Current Date]*
*Version: 2.0 - Updated for unified $5 commission structure* 