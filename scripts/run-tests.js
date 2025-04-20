#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

// Check for command line arguments
const args = process.argv.slice(2);
const shouldStartServer = args.includes('--with-server') || args.includes('-s');
let serverProcess = null;

// Print a section header
function printHeader(text) {
  console.log('\n' + colors.bright + colors.cyan + '╔═════════════════════════════════════════════════════════════════════╗' + colors.reset);
  console.log(colors.bright + colors.cyan + '║ ' + colors.yellow + text.padEnd(65) + colors.cyan + ' ║' + colors.reset);
  console.log(colors.bright + colors.cyan + '╚═════════════════════════════════════════════════════════════════════╝\n' + colors.reset);
}

// Execute a command and handle errors
function execute(command, options = {}) {
  try {
    execSync(command, { stdio: 'inherit', ...options });
    return true;
  } catch (error) {
    if (!options.ignoreError) {
      console.error(`${colors.red}Command failed: ${command}${colors.reset}`);
      if (options.exitOnError) {
        process.exit(1);
      }
    }
    return false;
  }
}

// Execute a command asynchronously
function executeAsync(command, args = [], options = {}) {
  console.log(`${colors.yellow}Starting: ${command} ${args.join(' ')}${colors.reset}`);
  return spawn(command, args, { 
    stdio: options.silent ? 'ignore' : 'inherit',
    detached: options.detached,
    shell: process.platform === 'win32'
  });
}

// Ensure the test directories exist
function ensureDirectories() {
  const directories = [
    'src/components/__tests__',
    'src/components/ui/__tests__',
    'src/tests/__tests__',
  ];
  
  directories.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`${colors.green}Created directory: ${dir}${colors.reset}`);
    }
  });
}

// Start the server and database
async function startServerAndDatabase() {
  // Step 1: Set up the test database
  printHeader('Setting up Test Database');
  try {
    // Setup SQLite test database
    execute('node scripts/setup-sqlite-test-db.js');
    console.log(`${colors.green}✓ Test database setup complete${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error setting up database: ${error.message}${colors.reset}`);
    process.exit(1);
  }
  
  // Step 2: Start Prisma Studio in the background
  printHeader('Starting Prisma Studio');
  const prismaStudio = executeAsync('npx', ['prisma', 'studio'], { detached: true });
  
  // Wait for Prisma Studio to start
  console.log(`${colors.yellow}Waiting for Prisma Studio to start on port 5555...${colors.reset}`);
  await new Promise(resolve => setTimeout(resolve, 3000));
  console.log(`${colors.green}✓ Prisma Studio should be running now${colors.reset}`);
  
  // Step 3: Start the development server in the background
  printHeader('Starting Development Server');
  serverProcess = executeAsync('npm', ['run', 'dev'], { detached: true });
  
  // Wait for server to start
  console.log(`${colors.yellow}Waiting for server to start...${colors.reset}`);
  await new Promise(resolve => setTimeout(resolve, 5000));
  console.log(`${colors.green}✓ Server should be running now${colors.reset}`);
  
  // Store both processes for cleanup
  serverProcesses = [serverProcess, prismaStudio];
}

// Update the cleanup function to handle multiple processes
let serverProcesses = [];

// Cleanup server processes
function cleanupServer() {
  serverProcesses.forEach(process => {
    if (process && !process.killed) {
      try {
        process.platform === 'win32' 
          ? execute('taskkill /pid ' + process.pid + ' /F /T', { ignoreError: true })
          : process.kill(-process.pid);
      } catch (error) {
        console.error(`${colors.yellow}Warning: Could not kill process: ${error.message}${colors.reset}`);
      }
    }
  });
  console.log(`${colors.green}✓ All processes terminated${colors.reset}`);
}

// Main function
async function main() {
  printHeader('Running ScoopifyClub Tests');
  
  ensureDirectories();
  
  // Step 1: Clean up previous test results
  printHeader('Cleaning up previous test results');
  try {
    if (fs.existsSync('coverage')) {
      fs.rmSync('coverage', { recursive: true, force: true });
    }
    if (fs.existsSync('test-results')) {
      fs.rmSync('test-results', { recursive: true, force: true });
    }
    if (fs.existsSync('playwright-report')) {
      fs.rmSync('playwright-report', { recursive: true, force: true });
    }
  } catch (error) {
    console.error(`${colors.red}Error cleaning up directories: ${error.message}${colors.reset}`);
  }
  
  // Check if server should be started
  if (shouldStartServer) {
    await startServerAndDatabase();
  }
  
  // Step 2: Run Jest tests
  printHeader('Running Jest Unit Tests');
  const jestSuccess = execute('npx jest --coverage');
  
  if (jestSuccess) {
    console.log(`${colors.green}✓ Jest tests completed successfully${colors.reset}`);
  } else {
    console.log(`${colors.yellow}⚠ Some Jest tests failed, but continuing...${colors.reset}`);
  }
  
  // Step 3: Run Playwright tests
  printHeader('Running Playwright E2E Tests');
  const playwrightSuccess = execute('npx playwright test', { ignoreError: true });
  
  if (playwrightSuccess) {
    console.log(`${colors.green}✓ Playwright tests completed successfully${colors.reset}`);
  } else {
    console.log(`${colors.yellow}⚠ Some Playwright tests failed${colors.reset}`);
  }
  
  // Cleanup server if started
  if (shouldStartServer) {
    printHeader('Cleaning Up');
    cleanupServer();
  }
  
  // Summary
  printHeader('Test Summary');
  
  if (jestSuccess && playwrightSuccess) {
    console.log(`${colors.green}${colors.bright}All tests passed successfully!${colors.reset}`);
  } else {
    console.log(`${colors.yellow}${colors.bright}Some tests had issues. Check the logs above for details.${colors.reset}`);
  }
  
  // Show coverage info
  if (fs.existsSync('coverage/lcov-report/index.html')) {
    const coveragePath = path.join(process.cwd(), 'coverage/lcov-report/index.html');
    console.log(`\n${colors.bright}Coverage report is available at:${colors.reset}`);
    console.log(`${colors.cyan}${coveragePath}${colors.reset}`);
  }
  
  // Show Playwright report
  if (fs.existsSync('playwright-report/index.html')) {
    const playwrightReportPath = path.join(process.cwd(), 'playwright-report/index.html');
    console.log(`\n${colors.bright}Playwright report is available at:${colors.reset}`);
    console.log(`${colors.cyan}${playwrightReportPath}${colors.reset}`);
    console.log(`\nTo view the report in the browser, run: ${colors.green}npx playwright show-report${colors.reset}`);
  }
}

main().catch(error => {
  // Make sure to clean up server process if there's an error
  if (shouldStartServer) {
    cleanupServer();
  }
  
  console.error(`${colors.red}${colors.bright}Error in test script:${colors.reset}`, error);
  process.exit(1);
}); 