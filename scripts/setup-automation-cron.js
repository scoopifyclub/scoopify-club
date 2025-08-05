#!/usr/bin/env node

/**
 * Setup script for ScoopifyClub automation cron jobs
 * This script helps you configure the automation systems for production
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🤖 ScoopifyClub Automation Setup Script');
console.log('=====================================\n');

// Cron job configurations
const cronJobs = [
  {
    name: 'Weekly Service Creation',
    endpoint: '/api/cron/create-weekly-services',
    schedule: '0 9 * * 1', // Every Monday at 9 AM
    description: 'Creates weekly services for active subscriptions'
  },
  {
    name: 'Employee Recruitment Automation',
    endpoint: '/api/cron/automated-employee-recruitment',
    schedule: '0 10 * * 2', // Every Tuesday at 10 AM
    description: 'Analyzes coverage gaps and recruits employees'
  },
  {
    name: 'Customer Acquisition Automation',
    endpoint: '/api/cron/automated-customer-acquisition',
    schedule: '0 11 * * 3', // Every Wednesday at 11 AM
    description: 'Identifies leads and sends marketing campaigns'
  },
  {
    name: 'Business Intelligence Automation',
    endpoint: '/api/cron/business-intelligence',
    schedule: '0 8 * * 6', // Every Saturday at 8 AM
    description: 'Generates weekly reports and analyzes business metrics'
  },
  {
    name: 'Employee Payout Processing',
    endpoint: '/api/cron/process-employee-payouts',
    schedule: '0 12 * * 5', // Every Friday at 12 PM
    description: 'Processes weekly employee payouts'
  }
];

// Generate cron configuration
function generateCronConfig() {
  console.log('📋 Cron Job Configuration:');
  console.log('==========================\n');
  
  cronJobs.forEach((job, index) => {
    console.log(`${index + 1}. ${job.name}`);
    console.log(`   Endpoint: ${job.endpoint}`);
    console.log(`   Schedule: ${job.schedule}`);
    console.log(`   Description: ${job.description}`);
    console.log('');
  });
}

// Generate deployment instructions
function generateDeploymentInstructions() {
  console.log('🚀 Deployment Instructions:');
  console.log('===========================\n');
  
  console.log('1. Set up your production environment variables:');
  console.log('   - Copy .env.example to .env.production');
  console.log('   - Configure your database, Stripe, and JWT secrets');
  console.log('');
  
  console.log('2. Configure cron jobs on your hosting platform:');
  console.log('');
  
  cronJobs.forEach((job) => {
    const fullUrl = `https://your-domain.com${job.endpoint}`;
    console.log(`   ${job.schedule} curl -X POST "${fullUrl}"`);
  });
  
  console.log('');
  console.log('3. Alternative: Use a cron job service like:');
  console.log('   - Vercel Cron Jobs (if using Vercel)');
  console.log('   - GitHub Actions');
  console.log('   - AWS EventBridge');
  console.log('   - Google Cloud Scheduler');
  console.log('');
  
  console.log('4. Test the automation dashboard:');
  console.log('   - Visit /admin/dashboard/automation');
  console.log('   - Check system status and metrics');
  console.log('   - Test manual triggers');
  console.log('');
}

// Generate environment variables template
function generateEnvTemplate() {
  const envTemplate = `# ScoopifyClub Automation Environment Variables
# Copy this to your production .env file

# Database
DATABASE_URL="your-production-database-url"

# Authentication
JWT_SECRET="your-jwt-secret"
ADMIN_JWT_SECRET="your-admin-jwt-secret"

# Stripe (for payments)
STRIPE_SECRET_KEY="your-stripe-secret-key"
STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"
STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"

# Email (for notifications)
SMTP_HOST="your-smtp-host"
SMTP_PORT="587"
SMTP_USER="your-smtp-username"
SMTP_PASS="your-smtp-password"

# Automation Settings
AUTOMATION_ENABLED="true"
RECRUITMENT_AUTOMATION_ENABLED="true"
ACQUISITION_AUTOMATION_ENABLED="true"
BUSINESS_INTELLIGENCE_ENABLED="true"

# External Services (for job postings, marketing, etc.)
INDEED_API_KEY="your-indeed-api-key"
FACEBOOK_ADS_API_KEY="your-facebook-ads-api-key"
GOOGLE_ADS_API_KEY="your-google-ads-api-key"

# Monitoring
SENTRY_DSN="your-sentry-dsn"
LOG_LEVEL="info"
`;

  const envPath = path.join(process.cwd(), 'automation.env.example');
  fs.writeFileSync(envPath, envTemplate);
  console.log(`📝 Environment template created: ${envPath}`);
  console.log('');
}

// Generate health check script
function generateHealthCheckScript() {
  const healthCheckScript = `#!/bin/bash

# ScoopifyClub Automation Health Check Script
# Run this script to verify all automation systems are working

echo "🔍 Checking ScoopifyClub Automation Systems..."
echo "============================================="

BASE_URL="https://your-domain.com"

# Check automation status
echo "\\n📊 Checking automation status..."
curl -s "\${BASE_URL}/api/admin/automation-status" | jq '.'

# Check system metrics
echo "\\n📈 Checking system metrics..."
curl -s "\${BASE_URL}/api/admin/system-metrics" | jq '.'

# Check recent activity
echo "\\n📝 Checking recent activity..."
curl -s "\${BASE_URL}/api/admin/recent-activity?limit=5" | jq '.'

# Test manual trigger (optional)
echo "\\n🤖 Testing manual trigger (employee recruitment)..."
curl -s -X POST "\${BASE_URL}/api/admin/trigger-automation" \\
  -H "Content-Type: application/json" \\
  -d '{"automationType": "employee-recruitment"}' | jq '.'

echo "\\n✅ Health check complete!"
`;

  const scriptPath = path.join(process.cwd(), 'scripts', 'health-check.sh');
  fs.writeFileSync(scriptPath, healthCheckScript);
  fs.chmodSync(scriptPath, '755');
  console.log(`🔍 Health check script created: ${scriptPath}`);
  console.log('');
}

// Main execution
function main() {
  generateCronConfig();
  generateDeploymentInstructions();
  generateEnvTemplate();
  generateHealthCheckScript();
  
  console.log('🎉 Setup complete!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Review the cron job configurations above');
  console.log('2. Set up your production environment variables');
  console.log('3. Configure cron jobs on your hosting platform');
  console.log('4. Test the automation dashboard at /admin/dashboard/automation');
  console.log('5. Run the health check script to verify everything is working');
  console.log('');
  console.log('For more information, see PRODUCTION_READINESS.md');
}

// Run the setup
main();

export {
  cronJobs,
  generateCronConfig,
  generateDeploymentInstructions,
  generateEnvTemplate,
  generateHealthCheckScript
}; 