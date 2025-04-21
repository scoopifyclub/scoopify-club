// scripts/prepare-postgresql-migration.js
// This script helps prepare Prisma migrations for PostgreSQL on Vercel

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Preparing PostgreSQL migration for Vercel deployment...');

// Function to execute shell commands and log output
function execCommand(command) {
  try {
    console.log(`Running: ${command}`);
    const output = execSync(command, { 
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { 
        ...process.env, 
        DATABASE_PROVIDER: 'postgresql' 
      }
    }).toString();
    console.log(output);
    return output;
  } catch (error) {
    console.error(`Command failed: ${command}`);
    console.error(error.stdout?.toString() || error.message);
    throw error;
  }
}

// Check if there are pending changes to the schema
console.log('📊 Checking for pending database changes...');

try {
  // Create a migration with a name based on current timestamp
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const migrationName = `vercel_deploy_${timestamp}`;
  
  // Create a migration (--create-only flag doesn't apply the migration)
  execCommand(`npx prisma migrate dev --name ${migrationName} --create-only`);
  
  console.log('✅ Migration files created successfully');
  console.log('📋 Migration Summary:');
  console.log('1. Migration files are ready for deployment');
  console.log('2. Use "npx prisma migrate deploy" on Vercel to apply them');
  console.log('3. Your Vercel build script (vercel-build) will handle this automatically');
  
} catch (error) {
  console.error('❌ Migration preparation failed');
  process.exit(1);
}

// Check for potential issues with PostgreSQL compatibility
console.log('🔍 Checking for PostgreSQL compatibility issues...');

// List of SQLite features that might not work in PostgreSQL
const sqliteSpecificFeatures = [
  'AUTOINCREMENT',
  'ISNULL',
  'PRAGMA',
  'VACUUM',
  'sqlite_'
];

// Get all Prisma schema files
const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
const schemaContent = fs.readFileSync(schemaPath, 'utf8');

// Check for potential issues
let potentialIssues = false;
sqliteSpecificFeatures.forEach(feature => {
  if (schemaContent.includes(feature)) {
    console.warn(`⚠️ Potential compatibility issue: Found "${feature}" in schema, which may need adjustment for PostgreSQL`);
    potentialIssues = true;
  }
});

if (!potentialIssues) {
  console.log('✅ No obvious PostgreSQL compatibility issues found');
}

console.log('\n🚀 Your project is ready for Vercel deployment with PostgreSQL!');
console.log('Run "npm run deploy" to deploy to Vercel'); 