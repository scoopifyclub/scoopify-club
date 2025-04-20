#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

// Print a section header
function printHeader(text) {
  console.log('\n' + colors.bright + colors.cyan + '╔═════════════════════════════════════════════════════════════════════╗' + colors.reset);
  console.log(colors.bright + colors.cyan + '║ ' + colors.yellow + text.padEnd(65) + colors.cyan + ' ║' + colors.reset);
  console.log(colors.bright + colors.cyan + '╚═════════════════════════════════════════════════════════════════════╝\n' + colors.reset);
}

// Execute a command synchronously
function executeSync(command, options = {}) {
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

// Execute a command asynchronously
function execute(command, args = [], options = {}) {
  console.log(`${colors.yellow}Starting: ${command} ${args.join(' ')}${colors.reset}`);
  return spawn(command, args, { 
    stdio: options.silent ? 'ignore' : 'inherit',
    detached: options.detached,
    shell: process.platform === 'win32'
  });
}

// Main function
async function main() {
  printHeader('Setting up Test Environment');
  
  // Step 1: Check if database exists and set it up if needed
  printHeader('Setting up Test Database');
  try {
    // First try to create the test database (might fail if already exists)
    executeSync('npm run test:db:create', { exitOnError: false });
    
    // Set up test data
    executeSync('npm run test:db:setup');
    console.log(`${colors.green}✓ Test database setup complete${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error setting up database: ${error.message}${colors.reset}`);
    process.exit(1);
  }
  
  // Step 2: Start the development server in the background
  printHeader('Starting Development Server');
  const server = execute('npm', ['run', 'dev'], { detached: true });
  
  // Wait for server to start
  console.log(`${colors.yellow}Waiting for server to start...${colors.reset}`);
  await new Promise(resolve => setTimeout(resolve, 5000));
  console.log(`${colors.green}✓ Server should be running now${colors.reset}`);
  
  // Step 3: Run the tests
  printHeader('Running Tests');
  try {
    executeSync('npm run test:all');
    console.log(`${colors.green}✓ All tests completed${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error running tests: ${error.message}${colors.reset}`);
  }
  
  // Step 4: Cleanup
  printHeader('Cleaning Up');
  if (server && !server.killed) {
    process.platform === 'win32' 
      ? executeSync('taskkill /pid ' + server.pid + ' /F /T', { exitOnError: false })
      : process.kill(-server.pid);
    console.log(`${colors.green}✓ Server process terminated${colors.reset}`);
  }
  
  console.log(`${colors.green}${colors.bright}Test environment cleanup complete!${colors.reset}`);
}

main().catch(error => {
  console.error(`${colors.red}${colors.bright}Error in test setup script:${colors.reset}`, error);
  process.exit(1);
}); 