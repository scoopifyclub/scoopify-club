#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'JWT_SECRET',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASSWORD',
  'EMAIL_FROM'
];

async function main() {
  console.log('🔍 Running pre-deployment checks...\n');
  
  // Check for .env file
  if (!fs.existsSync(path.join(process.cwd(), '.env'))) {
    console.error('❌ .env file is missing');
    process.exit(1);
  }
  
  // Check required environment variables
  const missingVars = [];
  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    }
  }
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(v => console.error(`   - ${v}`));
    process.exit(1);
  }

  // Validate DATABASE_URL format
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl.startsWith('postgresql://')) {
    console.error('❌ DATABASE_URL must be a PostgreSQL connection string');
    process.exit(1);
  }

  // Check Prisma schema
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  if (!fs.existsSync(schemaPath)) {
    console.error('❌ Prisma schema file is missing');
    process.exit(1);
  }

  // Test database connection
  try {
    const prisma = new PrismaClient();
    await prisma.$connect();
    console.log('✅ Database connection successful');
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }

  console.log('\n✅ All pre-deployment checks passed!');
}

main().catch(error => {
  console.error('❌ Deployment check failed:', error);
  process.exit(1);
}); 