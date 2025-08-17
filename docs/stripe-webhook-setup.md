# 🔗 Stripe Webhook Setup Guide

## Overview
This guide will help you configure Stripe webhooks to handle recurring payment events automatically.

## Step 1: Access Stripe Dashboard
1. Go to [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Sign in to your ScoopifyClub account
3. Make sure you're in **Test Mode** (toggle in top-right corner)

## Step 2: Configure Webhook Endpoint
1. Navigate to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set the endpoint URL to: `https://yourdomain.com/api/webhooks/stripe`
   - For local testing: `http://localhost:3002/api/webhooks/stripe`
   - For production: `https://scoopifyclub.com/api/webhooks/stripe`
4. Select events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.updated`
   - `payment_method.attached`
   - `payment_method.detached`

## Step 3: Get Webhook Secret
1. After creating the webhook, click on it
2. Click **Reveal** next to "Signing secret"
3. Copy the `whsec_...` value
4. Add it to your `.env.local` file:
   ```
   STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret_here"
   ```

## Step 4: Test Webhook
1. In the webhook details, click **Send test webhook**
2. Select `customer.subscription.created` event
3. Click **Send test webhook**
4. Check your server logs for the webhook event

## Step 5: Customer Portal Configuration
1. Go to **Settings** → **Billing** → **Customer Portal**
2. Configure the following settings:
   - **Business information**: Add your business name and logo
   - **Branding**: Customize colors and styling
   - **Products**: Enable subscription management
   - **Payment methods**: Allow customers to update cards
   - **Billing**: Enable invoice downloads
   - **Tax**: Configure tax settings if needed

## Step 6: Test Customer Portal
1. Use the test script to create a test customer
2. Create a portal session for the customer
3. Verify the customer can access the portal
4. Test subscription management features

## Troubleshooting

### Webhook Not Receiving Events
- Check if your server is accessible from the internet
- Verify the webhook URL is correct
- Ensure your server is running and the endpoint is working

### Authentication Errors
- Verify `STRIPE_WEBHOOK_SECRET` is set correctly
- Check that the webhook secret matches what's in Stripe dashboard
- Ensure the secret starts with `whsec_`

### Event Processing Errors
- Check your server logs for error details
- Verify your webhook handler code is working
- Test with Stripe CLI for local development

## Local Development with Stripe CLI

For local testing, you can use Stripe CLI:

1. Install Stripe CLI: `brew install stripe/stripe-cli/stripe`
2. Login: `stripe login`
3. Forward webhooks: `stripe listen --forward-to localhost:3002/api/webhooks/stripe`
4. Use the webhook secret provided by the CLI

## Production Deployment

When deploying to production:

1. Update webhook endpoint URL to your production domain
2. Ensure `STRIPE_WEBHOOK_SECRET` is set in production environment
3. Test webhook delivery in production
4. Monitor webhook events for any failures

## Security Notes

- Never commit webhook secrets to version control
- Use environment variables for all sensitive data
- Regularly rotate webhook secrets
- Monitor webhook events for suspicious activity
- Implement proper authentication in your webhook handlers
