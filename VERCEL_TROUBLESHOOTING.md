# Vercel Deployment Troubleshooting Guide

This guide provides solutions for common issues that may occur when deploying the ScoopifyClub application to Vercel.

## Quick Checklist Before Deployment

1. Ensure all required environment variables are set (run `npm run verify:env`)
2. Make sure your database is accessible from Vercel's servers
3. Verify your code is committed to the repository
4. Check that Prisma schema and migrations are updated

## Deployment Health Check

After deployment, visit `/api/deployment-check` on your Vercel URL to verify:
- Database connection
- Environment variables
- Runtime configuration

## Common Issues and Solutions

### 1. Build Failures

#### Prisma Generate Error

**Symptoms**: Build fails with Prisma generation errors

**Solutions**:
- Check that `DATABASE_URL` and `DIRECT_URL` are correctly set
- Make sure PostgreSQL database is accessible from Vercel
- Try running `npx prisma generate` locally to verify schema

#### Node.js Version Issues

**Symptoms**: Build fails with Node.js compatibility errors

**Solutions**:
- Verify the Node.js version in `package.json` > `engines` matches Vercel's supported versions
- Currently using: `"node": ">=20.x"`

### 2. Runtime Errors

#### Database Connection Issues

**Symptoms**: App deploys but shows database connection errors

**Solutions**:
- Check that your database allows connections from Vercel's IP ranges
- Ensure the connection pool is properly configured (see `prisma.ts`)
- Verify `DIRECT_URL` is set for Prisma to bypass connection pooling when needed

#### Environment Variable Issues

**Symptoms**: App shows "Missing environment variable" errors

**Solutions**:
- Verify all required variables are set in Vercel dashboard
- Run `npm run verify:env` to check for missing variables
- Make sure variables are used correctly in code (check for typos)

#### API Routes Not Working

**Symptoms**: API routes return 500 errors or don't respond

**Solutions**:
- Check that runtime is correctly specified (use `export const runtime = 'nodejs'` for complex routes)
- Use the error handler wrapper for consistent error handling
- Verify route handlers are using the correct parameter format for Next.js 15

### 3. CRON Job Issues

**Symptoms**: Scheduled jobs don't run

**Solutions**:
- Verify `CRON_SECRET` is set in Vercel environment variables
- Check that cron paths in `vercel.json` match your actual API routes
- Ensure cron routes use proper authorization validation

### 4. Slow Performance

**Symptoms**: App is slow or timeouts occur

**Solutions**:
- Check database connection pooling settings
- Use caching for frequently accessed data
- Optimize API routes with proper Edge/Node runtime settings
- Review bundle size with `npm run analyze:bundle`

## Deployment Recovery

If your deployment fails and you need to roll back:

1. In the Vercel dashboard, go to Deployments
2. Find the last working deployment
3. Click the three dots menu (⋮) and select "Promote to Production"

## Getting More Help

If you continue to face issues:

1. Check the Function Logs in Vercel dashboard
2. Examine the deployment-check endpoint response
3. Try deploying to a preview environment first with:
   ```
   npx vercel
   ```
4. Review the deployment logs for specific errors

## Advanced Debugging

For persistent issues:

1. Enable more verbose Prisma logging:
   ```ts
   new PrismaClient({
     log: ['query', 'info', 'warn', 'error'],
   })
   ```

2. Use Vercel CLI to get detailed logs:
   ```
   npx vercel logs your-app-name
   ```

3. Try inspecting the serverless function:
   ```
   npx vercel dev
   ``` 