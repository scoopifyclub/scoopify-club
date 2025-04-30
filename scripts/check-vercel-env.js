#!/usr/bin/env node

require('dotenv').config();
const { execSync } = require('child_process');

async function checkVercelEnv() {
    console.log('🔍 Checking Vercel environment variables...\n');

    try {
        // Get current environment variables from Vercel
        const vercelEnv = execSync('vercel env ls', { encoding: 'utf8' });
        console.log('Current Vercel environment variables:');
        console.log(vercelEnv);

        // Required environment variables
        const requiredEnvVars = [
            'DATABASE_URL',
            'JWT_SECRET',
            'JWT_REFRESH_SECRET',
            'STRIPE_SECRET_KEY',
            'STRIPE_WEBHOOK_SECRET',
            'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
            'EMAIL_HOST',
            'EMAIL_PORT',
            'EMAIL_USER',
            'EMAIL_PASSWORD',
            'EMAIL_FROM'
        ];

        // Check each required variable
        for (const envVar of requiredEnvVars) {
            try {
                execSync(`vercel env ls ${envVar}`, { stdio: 'ignore' });
                console.log(`✅ ${envVar} is set`);
            } catch (error) {
                console.error(`❌ ${envVar} is not set`);
                process.exit(1);
            }
        }

        console.log('\n✅ All required environment variables are set in Vercel');
    } catch (error) {
        console.error('❌ Failed to check Vercel environment:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    checkVercelEnv().catch(error => {
        console.error('\n❌ Environment check failed:', error);
        process.exit(1);
    });
}

module.exports = checkVercelEnv; 