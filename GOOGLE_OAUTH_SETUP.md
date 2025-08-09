# 🔐 Google OAuth Setup Guide for Scoopify Club

This guide will walk you through setting up Google OAuth authentication for your Scoopify Club application.

## 📋 Prerequisites

- Google Cloud Console account
- Domain verification (for production)
- HTTPS enabled (required for OAuth)

## 🚀 Step-by-Step Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API and Google OAuth2 API

### 2. Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** user type
3. Fill in the required information:
   - **App name**: Scoopify Club
   - **User support email**: Your email
   - **Developer contact information**: Your email
   - **Authorized domains**: Add your domain (e.g., `scoopify.club`)

### 3. Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client IDs**
3. Choose **Web application**
4. Configure the OAuth client:
   - **Name**: Scoopify Club Web Client
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (development)
     - `https://your-vercel-app.vercel.app` (production)
     - `https://scoopify.club` (custom domain)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/callback/google` (development)
     - `https://your-vercel-app.vercel.app/api/auth/callback/google` (production)
     - `https://scoopify.club/api/auth/callback/google` (custom domain)

### 4. Get Your Credentials

After creating the OAuth client, you'll receive:
- **Client ID** (looks like: `123456789-abcdefghijklmnop.apps.googleusercontent.com`)
- **Client Secret** (looks like: `GOCSPX-abcdefghijklmnop`)

## 🔧 Environment Variables

Add these to your `.env.local` and Vercel environment variables:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

### Vercel Setup

1. Go to your Vercel project dashboard
2. Navigate to **Settings** > **Environment Variables**
3. Add both variables:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
4. Set environment to **Production**, **Preview**, and **Development**

## 🧪 Testing

### Local Development

1. Start your development server: `npm run dev`
2. Go to `/login` or `/signup`
3. Click "Sign in with Google" or "Sign up with Google"
4. Complete the Google OAuth flow

### Production Testing

1. Deploy to Vercel
2. Test the Google sign-in on your live site
3. Verify redirects work correctly

## 🔒 Security Considerations

### OAuth Consent Screen

- **Publishing status**: Keep as "Testing" during development
- **User limit**: Set appropriate limits for testing
- **Scopes**: Only request necessary scopes (email, profile)

### Production Deployment

- **Domain verification**: Verify your domain in Google Cloud Console
- **HTTPS required**: OAuth only works over HTTPS
- **Redirect URIs**: Ensure exact match with your production URLs

## 🐛 Troubleshooting

### Common Issues

1. **"redirect_uri_mismatch"**
   - Check that your redirect URI exactly matches what's configured
   - Include protocol (http/https) and trailing slashes

2. **"invalid_client"**
   - Verify your Client ID and Secret are correct
   - Check that the OAuth client is properly configured

3. **"access_denied"**
   - User may have denied permission
   - Check OAuth consent screen configuration

4. **"invalid_grant"**
   - Usually indicates expired or invalid authorization code
   - Try signing in again

### Debug Steps

1. Check browser console for errors
2. Verify environment variables are loaded
3. Confirm OAuth client configuration
4. Test with different browsers/devices

## 📱 Mobile Considerations

If you plan to support mobile apps:

1. Create additional OAuth clients for mobile platforms
2. Use appropriate redirect URIs for mobile
3. Consider implementing deep linking

## 🔄 Updating Existing Users

When users sign in with Google for the first time:

1. A new user account is created automatically
2. Default role is set to `CUSTOMER`
3. Basic profile information is populated from Google
4. User can complete their profile later

## 📊 Monitoring

Monitor OAuth usage in Google Cloud Console:

1. **OAuth consent screen** > **User type** shows consent rates
2. **APIs & Services** > **Dashboard** shows API usage
3. **IAM & Admin** > **Audit Logs** shows authentication events

## 🎯 Next Steps

After setup:

1. Test the complete authentication flow
2. Customize the user experience
3. Add additional OAuth providers if needed
4. Implement user profile completion flows
5. Set up proper error handling

## 📞 Support

If you encounter issues:

1. Check Google Cloud Console error logs
2. Verify your configuration matches this guide
3. Test with a simple OAuth flow first
4. Ensure all environment variables are set correctly

---

**Note**: Keep your Client Secret secure and never commit it to version control. Use environment variables for all sensitive configuration. 