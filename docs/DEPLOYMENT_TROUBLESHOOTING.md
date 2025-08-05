# Deployment Troubleshooting Guide

## Current Status: 404 Errors

The deployment is responding with 404 errors, which indicates the build might have failed or there are routing issues.

## 🔍 **Step-by-Step Troubleshooting**

### 1. Check Vercel Build Status

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Find your project**: `scoopify-club`
3. **Check the latest deployment**:
   - Look for build status (Success/Failed)
   - Check build logs for errors
   - Verify deployment URL

### 2. Common Build Issues & Solutions

#### Issue: Module parse failed - Identifier already declared
**Solution**: Remove duplicate export declarations in API routes

#### Issue: Missing email service functions
**Solution**: Add missing functions to `src/lib/email-service.js`

#### Issue: Environment variables not configured
**Solution**: Configure required environment variables in Vercel

### 3. Environment Variables Setup

Configure these in Vercel Dashboard > Settings > Environment Variables:

```bash
# Database
DATABASE_URL=your_database_connection_string

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret
JWT_SECRET=your_jwt_secret

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Email (Namecheap)
NAMECHEAP_SMTP_HOST=mail.privateemail.com
NAMECHEAP_SMTP_PORT=587
NAMECHEAP_EMAIL_USER=your_email@domain.com
NAMECHEAP_EMAIL_PASS=your_email_password

# App Configuration
NEXT_PUBLIC_APP_URL=https://scoopifyclub.vercel.app
```

### 4. Database Connection

1. **Verify database is accessible** from Vercel's servers
2. **Check database URL format**:
   ```
   postgresql://username:password@host:port/database
   ```
3. **Ensure database exists** and is properly configured

### 5. Routing Issues

If the build succeeds but pages return 404:

1. **Check Next.js routing**:
   - Verify `src/app/page.jsx` exists (homepage)
   - Check API routes in `src/app/api/`
   - Ensure proper file structure

2. **Check middleware**:
   - Verify `src/middleware.js` doesn't block requests
   - Check authentication requirements

### 6. Local Testing

Test locally before deploying:

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run development server
npm run dev

# Test key endpoints
curl http://localhost:3000/
curl http://localhost:3000/api/health
```

### 7. Build Commands

Verify build commands in `package.json`:

```json
{
  "scripts": {
    "build": "next build",
    "postinstall": "prisma generate"
  }
}
```

### 8. Vercel Configuration

Check `vercel.json`:

```json
{
  "version": 2,
  "functions": {
    "src/app/api/**/*.js": {
      "maxDuration": 30
    }
  }
}
```

## 🚨 **Emergency Fixes**

### If Build Continues to Fail:

1. **Clear Vercel cache**:
   - Go to Vercel Dashboard
   - Project Settings > General
   - Click "Clear Build Cache"

2. **Redeploy from scratch**:
   - Delete and recreate the Vercel project
   - Connect to the same GitHub repository

3. **Check for syntax errors**:
   ```bash
   npm run build
   ```

### If Pages Return 404:

1. **Check file structure**:
   ```
   src/app/
   ├── page.jsx          # Homepage
   ├── layout.jsx        # Root layout
   ├── api/              # API routes
   └── globals.css       # Global styles
   ```

2. **Verify exports**:
   - Ensure components are properly exported
   - Check for default exports vs named exports

## 📞 **Getting Help**

### Vercel Support
- **Documentation**: https://vercel.com/docs
- **Community**: https://github.com/vercel/vercel/discussions
- **Status Page**: https://vercel-status.com

### Next.js Support
- **Documentation**: https://nextjs.org/docs
- **GitHub Issues**: https://github.com/vercel/next.js/issues

### Prisma Support
- **Documentation**: https://www.prisma.io/docs
- **GitHub Issues**: https://github.com/prisma/prisma/issues

## 🔄 **Next Steps After Fix**

1. **Test all endpoints**:
   ```bash
   node scripts/test-production-deployment.js
   ```

2. **Configure environment variables** in Vercel

3. **Set up custom domain** (optional)

4. **Test automation systems**:
   - Referral system
   - Email functionality
   - Payment processing

5. **Monitor performance** and error logs

## 📊 **Success Indicators**

✅ **Build Status**: "Ready" in Vercel Dashboard  
✅ **Homepage**: Returns 200 status  
✅ **API Health**: `/api/health` returns 200  
✅ **Database**: Connected and responding  
✅ **Environment**: All variables configured  

## 🎯 **Quick Fix Checklist**

- [ ] Check Vercel build logs
- [ ] Configure environment variables
- [ ] Verify database connection
- [ ] Test local build: `npm run build`
- [ ] Check file structure and exports
- [ ] Clear Vercel cache if needed
- [ ] Redeploy and test endpoints 