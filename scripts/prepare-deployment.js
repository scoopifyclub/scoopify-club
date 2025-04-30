#!/usr/bin/env node

require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function prepareDeployment() {
    console.log('🔧 Preparing project for Vercel deployment...\n');

    try {
        // 1. Generate Prisma client
        console.log('Generating Prisma client...');
        execSync('npx prisma generate', { stdio: 'inherit' });

        // 2. Check for required environment variables
        const requiredEnvVars = [
            'DATABASE_URL',
            'JWT_SECRET',
            'JWT_REFRESH_SECRET',
            'STRIPE_SECRET_KEY',
            'STRIPE_WEBHOOK_SECRET',
            'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
            'SMTP_HOST',
            'SMTP_PORT',
            'SMTP_USER',
            'SMTP_PASSWORD',
            'EMAIL_FROM'
        ];

        const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
        
        if (missingEnvVars.length > 0) {
            console.error('❌ Missing required environment variables:');
            missingEnvVars.forEach(varName => console.error(`   - ${varName}`));
            process.exit(1);
        }

        console.log('✅ All required environment variables are set\n');

        // 3. Verify database connection
        console.log('Verifying database connection...');
        try {
            execSync('npx prisma db pull', { stdio: 'inherit' });
            console.log('✅ Database connection verified\n');
        } catch (error) {
            console.error('❌ Failed to connect to database:', error.message);
            process.exit(1);
        }

        // 4. Check for pending migrations
        console.log('Checking for pending migrations...');
        try {
            execSync('npx prisma migrate status', { stdio: 'inherit' });
            console.log('✅ Migration status checked\n');
        } catch (error) {
            console.error('❌ Failed to check migration status:', error.message);
            process.exit(1);
        }

        // 5. Build the application
        console.log('Building the application...');
        try {
            execSync('npm run build', { stdio: 'inherit' });
            console.log('✅ Application built successfully\n');
        } catch (error) {
            console.error('❌ Build failed:', error.message);
            process.exit(1);
        }

        console.log('✅ Deployment preparation completed successfully!');
    } catch (error) {
        console.error('❌ Deployment preparation failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    prepareDeployment().catch(error => {
        console.error('\n❌ Deployment preparation failed:', error);
        process.exit(1);
    });
}

module.exports = prepareDeployment; 