#!/usr/bin/env node

require('dotenv').config()
const verifyDatabaseConnection = require('./verify-db')

async function checkDeployment() {
  console.log('🔍 Running pre-deployment checks...\n')

  // Check required environment variables
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
  ]

  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName])
  
  if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:')
    missingEnvVars.forEach(varName => console.error(`   - ${varName}`))
    process.exit(1)
  }

  console.log('✅ All required environment variables are set\n')

  // Verify database connection
  const dbConnected = await verifyDatabaseConnection()
  if (!dbConnected) {
    process.exit(1)
  }

  console.log('\n✅ All pre-deployment checks passed!')
}

// Run if called directly
if (require.main === module) {
  checkDeployment().catch(error => {
    console.error('\n❌ Pre-deployment checks failed:', error)
    process.exit(1)
  })
}

module.exports = checkDeployment 