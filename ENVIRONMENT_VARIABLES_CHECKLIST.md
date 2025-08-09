# 🔧 Environment Variables Checklist for Vercel Deployment

## ✅ **CRITICAL - Required for Basic Functionality**

### Database Configuration
- [ ] `DATABASE_URL` - PostgreSQL connection string (your Neon database)
- [ ] `DIRECT_URL` - Direct PostgreSQL connection URL (same as DATABASE_URL)

### Authentication
- [ ] `NEXTAUTH_SECRET` - Secret for NextAuth (min 32 characters)
- [ ] `NEXTAUTH_URL` - Full URL of your deployment (https://scoopify-club-eoou2melw-scoopifys-projects.vercel.app)
- [ ] `JWT_SECRET` - Secret for JWT tokens (min 32 characters)
- [ ] `JWT_REFRESH_SECRET` - Secret for refresh tokens (min 32 characters)

### Stripe Integration
- [ ] `STRIPE_SECRET_KEY` - Stripe secret key (starts with `sk_`)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (starts with `pk_`)
- [ ] `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret (starts with `whsec_`)

### Email Configuration (Namecheap)
- [ ] `NAMECHEAP_SMTP_HOST` - mail.privateemail.com
- [ ] `NAMECHEAP_SMTP_PORT` - 587
- [ ] `NAMECHEAP_EMAIL_USER` - your-email@domain.com
- [ ] `NAMECHEAP_EMAIL_PASS` - your-email-password

### App Configuration
- [ ] `NEXT_PUBLIC_APP_URL` - https://scoopify-club-eoou2melw-scoopifys-projects.vercel.app
- [ ] `ADMIN_EMAIL` - admin@scoopify.club

---

## ⚠️ **IMPORTANT - Required for Full Features**

### Google Maps (for location services)
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Your Google Maps API key
- [ ] `GOOGLE_MAPS_API_KEY` - Your Google Maps API key (server-side)

### Stripe Price IDs (for subscriptions)
- [ ] `STRIPE_WEEKLY_PRICE_ID` - price_weekly
- [ ] `STRIPE_BIWEEKLY_PRICE_ID` - price_biweekly
- [ ] `STRIPE_MONTHLY_PRICE_ID` - price_monthly
- [ ] `NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID` - price_monthly
- [ ] `NEXT_PUBLIC_STRIPE_CLEANUP_PRICE_ID` - price_cleanup

### Automation & Cron Jobs
- [ ] `CRON_SECRET` - Secret for securing CRON jobs (min 16 characters)
- [ ] `CRON_API_KEY` - API key for cron jobs

---

## 🔄 **OPTIONAL - Enhanced Features**

### AWS/S3 (for file uploads)
- [ ] `AWS_ACCESS_KEY_ID` - Your AWS access key
- [ ] `AWS_SECRET_ACCESS_KEY` - Your AWS secret key
- [ ] `AWS_REGION` - us-east-1
- [ ] `AWS_BUCKET_NAME` - scoopify-bucket
- [ ] `S3_BUCKET_NAME` - scoopify-bucket

### Redis (for caching)
- [ ] `REDIS_URL` - Redis connection URL
- [ ] `UPSTASH_REDIS_REST_URL` - Upstash Redis URL
- [ ] `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis token

### Monitoring & Analytics
- [ ] `SENTRY_DSN` - Sentry DSN for error tracking
- [ ] `GOOGLE_ANALYTICS_ID` - G-XXXXXXXXXX
- [ ] `GOOGLE_TAG_MANAGER_ID` - GTM-XXXXXXX

### SEO & Marketing
- [ ] `GOOGLE_VERIFICATION` - Google Search Console verification
- [ ] `YANDEX_VERIFICATION` - Yandex verification
- [ ] `YAHOO_VERIFICATION` - Yahoo verification
- [ ] `FACEBOOK_APP_ID` - Facebook app ID
- [ ] `TWITTER_CREATOR` - @scoopifyclub
- [ ] `LINKEDIN_COMPANY_ID` - LinkedIn company ID

### Referral System
- [ ] `REFERRAL_BONUS_SCOOPER` - 25.00
- [ ] `REFERRAL_BONUS_BUSINESS` - 50.00
- [ ] `REFERRAL_PERCENTAGE_SCOOPER` - 10
- [ ] `REFERRAL_PERCENTAGE_BUSINESS` - 15

---

## 🚨 **CURRENT STATUS**

Based on your current setup, here are the **MISSING** environment variables that need to be added to Vercel:

### ❌ **CRITICAL MISSING VARIABLES**
1. `NEXTAUTH_URL` - Set to: `https://scoopify-club-eoou2melw-scoopifys-projects.vercel.app`
2. `NEXT_PUBLIC_APP_URL` - Set to: `https://scoopify-club-eoou2melw-scoopifys-projects.vercel.app`
3. `NAMECHEAP_EMAIL_USER` - Your actual email address
4. `NAMECHEAP_EMAIL_PASS` - Your actual email password
5. `STRIPE_SECRET_KEY` - Your Stripe secret key (starts with `sk_`)
6. `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key (starts with `pk_`)
7. `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook secret (starts with `whsec_`)

### ⚠️ **IMPORTANT MISSING VARIABLES**
8. `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Your Google Maps API key
9. `GOOGLE_MAPS_API_KEY` - Your Google Maps API key (server-side)

---

## 🎯 **NEXT STEPS**

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard/scoopifyclub/scoopify-club/settings/environment-variables

2. **Add the missing variables** listed above

3. **Test the deployment** using our test script:
   ```bash
   node scripts/test-vercel-deployment.js
   ```

4. **Verify all features work**:
   - Customer signup
   - Employee signup
   - Payment processing
   - Email notifications
   - Job management system
   - Admin dashboard

---

## 📝 **QUICK SETUP COMMAND**

You can run this script to check what's missing:
```bash
node scripts/setup-production.js
```

This will tell you exactly which environment variables need to be configured in Vercel. 