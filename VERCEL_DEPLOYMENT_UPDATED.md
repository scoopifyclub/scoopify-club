# Updated Vercel Deployment Guide

This guide provides step-by-step instructions for deploying the updated ScoopifyClub application to Vercel.

## Prerequisites

1. Vercel account (create one at https://vercel.com if you don't have one)
2. Vercel CLI installed: `npm install -g vercel`
3. PostgreSQL database (Vercel PostgreSQL or other provider)

## Step 1: Fix Schema and Code Issues

We've identified some inconsistencies between the Prisma schema and the application code. We've created a fix script to temporarily address these issues:

```bash
npm run fix:vercel-deploy
```

This script:
1. Fixes the Prisma schema by removing invalid connection options
2. Generates a clean Prisma client
3. Creates a build trigger file to force a clean build on Vercel

## Step 2: Set Up Environment Variables

Ensure all necessary environment variables are set in your Vercel project. The most critical ones are:

- `DATABASE_URL`: Your PostgreSQL connection string
- `DIRECT_URL`: Direct PostgreSQL connection URL
- `JWT_SECRET` and `JWT_REFRESH_SECRET`: For authentication
- `NEXTAUTH_SECRET` and `NEXTAUTH_URL`: NextAuth settings
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, and `STRIPE_WEBHOOK_SECRET`: For payments
- `CRON_SECRET`: For securing CRON jobs

You can check your existing variables with:

```bash
npx vercel env ls
```

## Step 3: Deploy to Vercel

### Option A: Deploy using Vercel CLI

```bash
# For production deployment
npx vercel --prod

# For preview deployment
npx vercel
```

### Option B: Deploy using GitHub Integration

1. Connect your repository to Vercel
2. Configure the build settings:
   - Build Command: `npm run vercel-build`
   - Output Directory: `.next`
   - Node.js Version: 20.x

## Step 4: Verify Deployment

After deployment, check:

1. The deployment logs for any errors
2. Database connectivity via the health endpoint
3. Basic app functionality

## Troubleshooting

### Database Connection Issues

- Check that `DATABASE_URL` and `DIRECT_URL` are correctly formatted
- Verify that your database allows connections from Vercel's IP ranges
- Look for "PrismaClientInitializationError" in your logs

### Build Failures

- Review the build logs
- Check that all environment variables are properly set
- Verify the Next.js version compatibility (using 15.3.1)

### Runtime Errors

If you're experiencing runtime errors:

1. Check Vercel's Function Logs for specifics
2. Look for API route errors, especially related to Prisma models
3. Temporarily disable routes that are causing issues

## Next Steps for Full Fix

Once you have a successful deployment, you should:

1. Update the Prisma schema to match the expected fields in your code
2. Or update the code to match the Prisma schema
3. Run migrations properly to ensure database compatibility

## Support

If you continue to have issues, please contact the development team for assistance. 