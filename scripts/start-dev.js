const { execSync } = require('child_process');
const { spawn } = require('child_process');

// Function to kill process on specified ports
function killPorts(ports) {
  ports.forEach(port => {
    try {
      // For Windows
      execSync(`npx kill-port ${port} --force`);
      console.log(`Killed process on port ${port}`);
    } catch (error) {
      console.log(`No process found on port ${port}`);
    }
  });
}

// Function to start a process
function startProcess(command, args, name) {
  try {
    const process = spawn(command, args, { 
      stdio: 'inherit', 
      shell: true,
      detached: true // This keeps the process running even if the parent exits
    });
    console.log(`Started ${name}`);
    return process;
  } catch (error) {
    console.error(`Failed to start ${name}:`, error.message);
    return null;
  }
}

// Function to wait for a specified time
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main function
async function startDev() {
  console.log('Starting development environment...');
  
  // Kill any existing processes on ports 3000, 3001, and 5555
  killPorts([3000, 3001, 5555]);
  
  // Wait a moment to ensure ports are fully released
  console.log('Waiting for ports to be released...');
  await sleep(2000);
  
  // Start Prisma Studio first
  console.log('Starting Prisma Studio...');
  const prismaProcess = startProcess('npx', ['prisma', 'studio', '--port', '5555'], 'Prisma Studio');
  if (!prismaProcess) {
    console.error('Failed to start Prisma Studio');
    process.exit(1);
  }
  
  // Wait for Prisma Studio to start
  await sleep(3000);
  
  // Start Next.js development server
  console.log('Starting Next.js server...');
  const nextProcess = startProcess('npx', ['next', 'dev'], 'Next.js server');
  if (!nextProcess) {
    console.error('Failed to start Next.js server');
    prismaProcess.kill();
    process.exit(1);
  }
  
  // Wait for Next.js to start
  await sleep(3000);
  
  // Start SSL proxy
  console.log('Starting SSL proxy...');
  const proxyProcess = startProcess('npx', ['local-ssl-proxy', '--source', '3001', '--target', '3000'], 'SSL Proxy');
  if (!proxyProcess) {
    console.error('Failed to start SSL proxy');
    prismaProcess.kill();
    nextProcess.kill();
    process.exit(1);
  }
  
  console.log('\n=========================================================');
  console.log('Development environment started successfully!');
  console.log('Access your application at: https://localhost:3001');
  console.log('Access Prisma Studio at: http://localhost:5555');
  console.log('=========================================================\n');
  
  // Keep the script running
  process.stdin.resume();
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\nShutting down development environment...');
    nextProcess.kill();
    prismaProcess.kill();
    proxyProcess.kill();
    process.exit();
  });
}

// Run the script
startDev().catch(error => {
  console.error('Failed to start development environment:', error);
  process.exit(1);
}); 