# Environment Variables for Vercel Deployment

This document lists all the environment variables required for successfully deploying this app to Vercel.

## Required Variables

### Database Configuration
- `DATABASE_URL`: PostgreSQL connection string (e.g., "postgresql://user:password@hostname:port/database?sslmode=require")
- `DIRECT_URL`: Direct PostgreSQL connection URL for Prisma (same format as DATABASE_URL)

### Authentication
- `JWT_SECRET`: Secret for JWT tokens (min 32 characters)
- `JWT_REFRESH_SECRET`: Secret for refresh tokens (min 32 characters)

### NextAuth
- `NEXTAUTH_SECRET`: Secret for NextAuth (min 32 characters)
- `NEXTAUTH_URL`: Full URL of your deployment (e.g., "https://your-app.vercel.app")

### Stripe Integration
- `STRIPE_SECRET_KEY`: Stripe secret key starting with "sk_"
- `STRIPE_PUBLISHABLE_KEY`: Stripe publishable key starting with "pk_"
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook secret starting with "whsec_"

### Vercel-specific
- `CRON_SECRET`: Secret for securing CRON jobs (min 16 characters)

### API URL (Optional)
- `NEXT_PUBLIC_API_URL`: Public URL for API access

## Automatically Set by Vercel
These are automatically set by Vercel, but you can override them in development:

- `NODE_ENV`: Environment type ("development", "production", or "test")
- `VERCEL_ENV`: Vercel environment ("development", "preview", or "production")
- `VERCEL_URL`: The URL of your Vercel deployment

## Setting Up Variables in Vercel

1. Go to your project in the Vercel dashboard
2. Navigate to Settings > Environment Variables
3. Add each variable listed above with its corresponding value
4. Deploy your application

## Local Development

For local development, create a `.env.local` file with all the variables above, using development-appropriate values. 