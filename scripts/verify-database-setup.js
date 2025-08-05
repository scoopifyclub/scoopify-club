#!/usr/bin/env node

/**
 * Database verification script for ScoopifyClub
 * Verifies database connections, schema, and migrations
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🗄️  ScoopifyClub Database Verification');
console.log('=====================================\n');

function checkFileExists(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  return fs.existsSync(fullPath);
}

function verifyPrismaSetup() {
  console.log('📋 Verifying Prisma Setup...');
  
  const prismaPath = path.join(process.cwd(), 'prisma');
  if (!fs.existsSync(prismaPath)) {
    console.log('❌ Prisma directory not found');
    return false;
  }
  
  const prismaFiles = fs.readdirSync(prismaPath);
  console.log(`   Prisma files found: ${prismaFiles.length}`);
  
  // Check essential files
  const essentialFiles = ['schema.prisma'];
  const missing = essentialFiles.filter(file => !prismaFiles.includes(file));
  
  if (missing.length > 0) {
    console.log(`   ❌ Missing essential files: ${missing.join(', ')}`);
    return false;
  }
  
  console.log('   ✅ Essential Prisma files present');
  
  // Check schema.prisma content
  const schemaPath = path.join(prismaPath, 'schema.prisma');
  if (fs.existsSync(schemaPath)) {
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    
    // Check for essential configurations
    const checks = [
      { name: 'Database URL', pattern: /datasource db/, found: false },
      { name: 'Prisma Client', pattern: /generator client/, found: false },
      { name: 'User Model', pattern: /model User/, found: false },
      { name: 'Service Model', pattern: /model Service/, found: false },
      { name: 'Employee Model', pattern: /model Employee/, found: false },
      { name: 'Customer Model', pattern: /model Customer/, found: false },
      { name: 'SystemLog Model', pattern: /model SystemLog/, found: false }
    ];
    
    checks.forEach(check => {
      check.found = check.pattern.test(schemaContent);
      const status = check.found ? '✅' : '❌';
      console.log(`   ${status} ${check.name}`);
    });
    
    const allFound = checks.every(check => check.found);
    if (!allFound) {
      console.log('   ⚠️  Some essential models may be missing');
    }
  }
  
  console.log('');
  return true;
}

function verifyEnvironmentVariables() {
  console.log('🔧 Verifying Environment Variables...');
  
  const envFiles = [
    '.env',
    '.env.example',
    '.env.local',
    'automation.env.example'
  ];
  
  envFiles.forEach(file => {
    const exists = checkFileExists(file);
    const status = exists ? '✅' : '❌';
    console.log(`   ${status} ${file}`);
    
    if (exists && file === '.env') {
      const envContent = fs.readFileSync(file, 'utf8');
      const requiredVars = [
        'DATABASE_URL',
        'JWT_SECRET',
        'STRIPE_SECRET_KEY'
      ];
      
      const missing = requiredVars.filter(varName => !envContent.includes(varName));
      if (missing.length > 0) {
        console.log(`      ⚠️  Missing variables: ${missing.join(', ')}`);
      } else {
        console.log('      ✅ All required variables present');
      }
    }
  });
  
  console.log('');
}

async function verifyDatabaseConnection() {
  console.log('🔌 Testing Database Connection...');
  
  try {
    // Try to import Prisma client
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    // Test connection
    await prisma.$connect();
    console.log('   ✅ Database connection successful');
    
    // Test basic query
    try {
      const userCount = await prisma.user.count();
      console.log(`   ✅ Database query successful (${userCount} users found)`);
    } catch (error) {
      console.log(`   ⚠️  Database query failed: ${error.message}`);
    }
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.log(`   ❌ Database connection failed: ${error.message}`);
    console.log('   💡 Make sure your DATABASE_URL is correct and database is running');
  }
  
  console.log('');
}

function verifyMigrations() {
  console.log('🔄 Verifying Database Migrations...');
  
  const migrationsPath = path.join(process.cwd(), 'prisma', 'migrations');
  if (!fs.existsSync(migrationsPath)) {
    console.log('   ⚠️  No migrations directory found');
    console.log('   💡 Run: npx prisma migrate dev');
    console.log('');
    return;
  }
  
  const migrations = fs.readdirSync(migrationsPath).filter(dir => 
    fs.statSync(path.join(migrationsPath, dir)).isDirectory()
  );
  
  console.log(`   Found ${migrations.length} migrations`);
  
  if (migrations.length === 0) {
    console.log('   ⚠️  No migrations found');
    console.log('   💡 Run: npx prisma migrate dev --name init');
  } else {
    console.log('   ✅ Migrations present');
  }
  
  console.log('');
}

function generateDatabaseReport() {
  console.log('📊 Generating Database Report...\n');
  
  const report = {
    timestamp: new Date().toISOString(),
    prismaSetup: verifyPrismaSetup(),
    environmentFiles: {
      '.env': checkFileExists('.env'),
      '.env.example': checkFileExists('.env.example'),
      '.env.local': checkFileExists('.env.local'),
      'automation.env.example': checkFileExists('automation.env.example')
    },
    recommendations: []
  };
  
  // Generate recommendations
  if (!checkFileExists('prisma/schema.prisma')) {
    report.recommendations.push('Create Prisma schema file');
  }
  
  if (!checkFileExists('.env')) {
    report.recommendations.push('Create .env file with database configuration');
  }
  
  if (!checkFileExists('prisma/migrations')) {
    report.recommendations.push('Run database migrations: npx prisma migrate dev');
  }
  
  // Save report
  const reportPath = path.join(process.cwd(), 'database-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('   ✅ Database report saved to database-report.json');
  console.log('');
  
  return report;
}

async function main() {
  console.log('🔍 Starting database verification...\n');
  
  // Run verifications
  const prismaOk = verifyPrismaSetup();
  verifyEnvironmentVariables();
  await verifyDatabaseConnection();
  verifyMigrations();
  
  const report = generateDatabaseReport();
  
  console.log('🎉 Database verification complete!');
  console.log('');
  console.log('📋 Next Steps:');
  console.log('   1. Review database-report.json');
  console.log('   2. Fix any issues identified above');
  console.log('   3. Run: npx prisma generate');
  console.log('   4. Run: npx prisma migrate dev');
  console.log('   5. Test database connections');
  console.log('');
  console.log('🔧 Common Commands:');
  console.log('   npx prisma generate          # Generate Prisma client');
  console.log('   npx prisma migrate dev       # Run migrations');
  console.log('   npx prisma studio            # Open database GUI');
  console.log('   npx prisma db push           # Push schema changes');
  console.log('');
}

// Run the verification
main().catch(console.error);

export {
  verifyPrismaSetup,
  verifyEnvironmentVariables,
  verifyDatabaseConnection,
  verifyMigrations,
  generateDatabaseReport
}; 