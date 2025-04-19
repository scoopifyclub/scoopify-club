// scripts/migrate-postgresql.js
// This script runs prisma migrations for PostgreSQL on Vercel

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Temporarily modify the schema file for PostgreSQL migration
const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
let schemaContent = fs.readFileSync(schemaPath, 'utf8');

// Update the provider to PostgreSQL for migration
const postgresSchema = schemaContent.replace(
  'provider = env("DATABASE_PROVIDER")',
  'provider = "postgresql"'
);

// Write the temporary schema
fs.writeFileSync(schemaPath, postgresSchema);

console.log('Running PostgreSQL migrations...');

// Run Prisma migrate deploy
exec('npx prisma migrate deploy', (error, stdout, stderr) => {
  // Restore the original schema
  fs.writeFileSync(schemaPath, schemaContent);
  
  if (error) {
    console.error(`Migration error: ${error.message}`);
    console.error(stderr);
    process.exit(1);
    return;
  }
  
  console.log(stdout);
  console.log('PostgreSQL migrations completed successfully');
}); 