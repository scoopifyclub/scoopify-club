#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
};

const TEST_DB_PATH = path.join(process.cwd(), 'prisma', 'test.db');

// Execute a command and handle errors
function execute(command, options = {}) {
  try {
    console.log(`${colors.yellow}Running: ${command}${colors.reset}`);
    execSync(command, { stdio: 'inherit', ...options });
    return true;
  } catch (error) {
    console.error(`${colors.red}Command failed: ${command}${colors.reset}`);
    if (options.exitOnError) {
      process.exit(1);
    }
    return false;
  }
}

async function main() {
  console.log(`${colors.yellow}Setting up SQLite test database...${colors.reset}`);

  // Delete existing test database if it exists
  if (fs.existsSync(TEST_DB_PATH)) {
    console.log(`${colors.yellow}Removing existing test database...${colors.reset}`);
    fs.unlinkSync(TEST_DB_PATH);
    console.log(`${colors.green}Existing test database removed.${colors.reset}`);
  }

  // Make sure we're using the test environment
  process.env.NODE_ENV = 'test';
  
  // Create new test database with Prisma
  console.log(`${colors.yellow}Creating new test database...${colors.reset}`);
  
  // Force Prisma to use the test environment
  process.env.DATABASE_URL = `file:${TEST_DB_PATH}`;
  
  // Run migrations to set up the schema
  execute('npx prisma migrate deploy', { env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL } });
  
  // Run the test setup script to populate test data
  execute('npx ts-node scripts/setup-test-db.ts', { env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL } });
  
  console.log(`${colors.green}✅ SQLite test database setup complete!${colors.reset}`);
}

main().catch(error => {
  console.error(`${colors.red}Error setting up test database:${colors.reset}`, error);
  process.exit(1);
}); 