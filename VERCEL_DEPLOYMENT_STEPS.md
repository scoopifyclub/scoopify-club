# Vercel Deployment Steps for ScoopifyClub

## Recent Changes

1. **Parameter Handling Fix**: We've updated route handlers to use Promise-based parameters for Next.js 15 compatibility.
2. **Node.js Version**: Set Node.js version to >=20.x in package.json.
3. **Force Rebuild**: Added a force-rebuild.txt file to trigger a fresh build.

## Deployment Steps

### 1. Ensure Environment Variables

Make sure all these environment variables are set in your Vercel project:

- `DATABASE_URL`: Your PostgreSQL connection string
- `JWT_SECRET` and `JWT_REFRESH_SECRET`: Used for authentication
- `NEXTAUTH_SECRET` and `NEXTAUTH_URL`: Set to your Vercel deployment URL
- `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY`: For payment processing
- Any other variables specified in your .env.local file

### 2. Deploy to Vercel

Use the Vercel CLI:

```bash
npm run deploy:prod
```

Or deploy directly through the Vercel dashboard by connecting your GitHub repository.

### 3. Post-Deployment Verification

- Check the deployment logs for any errors
- Verify that database migrations were applied correctly
- Test critical functionality: authentication, payments, service scheduling
- Ensure CRON jobs are configured properly

## Troubleshooting

### If the deployment fails:

1. Check Vercel build logs for specific error messages
2. Verify all environment variables are set correctly
3. Make sure you're using the correct Node.js version (20.x)
4. Ensure your database is accessible from Vercel's servers
5. Check for any API route handler issues with parameters

### Common Issues:

- **Database Connection**: Make sure your DATABASE_URL is correctly formatted with SSL settings
- **Authentication Errors**: Check JWT secrets and NextAuth configuration
- **Route Handler Errors**: Ensure all route handlers use Promise-based parameters for Next.js 15

## Contact

If you continue to have issues, please reach out to the development team. 