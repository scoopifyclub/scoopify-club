# Deploying to Vercel

This guide provides step-by-step instructions for deploying the ScoopifyClub application to Vercel.

## Prerequisites

1. Vercel account (create one at https://vercel.com if you don't have one)
2. Vercel CLI installed: `npm install -g vercel`
3. PostgreSQL database (Vercel PostgreSQL or other provider)

## Step 1: Prepare Your Application

1. Make sure your code is committed to a Git repository (GitHub, GitLab, or Bitbucket)
2. Ensure your `.env.production` file is correctly populated with production values
3. **IMPORTANT**: Do not commit your `.env.production` file to Git (it should be in `.gitignore`)

## Step 2: Set Up Environment Variables

We've created a script to help with this process:

```bash
node scripts/setup-vercel-env.js
```

This will:
1. Read variables from your `.env.production` file
2. Log you into Vercel if needed
3. Add each environment variable to your Vercel project

Alternatively, you can manually add them through the Vercel dashboard:
- Go to your project on https://vercel.com
- Go to Settings > Environment Variables
- Add each variable from your `.env.production` file

## Step 3: Set Up the Database

### Option A: Use Vercel Postgres (Recommended)

1. In your Vercel project dashboard:
   - Go to "Storage" tab
   - Click "Create Database"
   - Select "PostgreSQL Database"
   - Choose your preferred region
   - Click "Create"

2. After creation, Vercel will automatically:
   - Add the `DATABASE_URL` to your project's environment variables
   - Configure the connection pooling
   - Set up automatic backups

### Option B: Use an External PostgreSQL Database

If you're using an external PostgreSQL database:

1. Ensure your Vercel deployment can connect to it (check network permissions)
2. Add your `DATABASE_URL` to Vercel environment variables
3. Make sure the URL includes necessary parameters (e.g., `?sslmode=require`)

## Step 4: Deploy Your Application

You can deploy using our script:

```bash
npm run deploy        # For preview deployment
npm run deploy:prod   # For production deployment
```

Or manually with Vercel CLI:

```bash
vercel              # Preview deployment
vercel --prod       # Production deployment
```

## Step 5: Run Database Migrations

After the first deployment, run the migrations:

```bash
npx prisma migrate deploy
```

If you're using Vercel Postgres, this will be handled automatically by the `vercel-build` command in our `package.json`.

## Troubleshooting

### Database Connection Issues

- Check that your `DATABASE_URL` is correctly formatted
- Make sure the database server allows connections from Vercel's IP addresses
- Verify the database user has the necessary permissions

### Build Failures

- Check the build logs in Vercel dashboard
- Ensure all environment variables are correctly set
- Verify that the Prisma schema is compatible with PostgreSQL

### Runtime Errors

- Check the Function Logs in Vercel dashboard
- Test your API endpoints
- Verify authentication is working correctly

## Important Notes

- Always update your environment variables when they change
- Never store sensitive information in your code or Git repository
- Monitor your application logs regularly

## Vercel-Specific Features Used

1. **Serverless Functions**: API routes automatically become serverless functions
2. **CRON Jobs**: Configured in `vercel.json` for scheduled tasks
3. **Environment Variables**: Securely stored in Vercel
4. **Preview Deployments**: Every PR and branch gets its own deployment
5. **Connection Pooling**: Used for efficient database connections

For any additional help, refer to the [Vercel Documentation](https://vercel.com/docs) or contact your development team. 