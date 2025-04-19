const { execSync } = require('child_process');
const readline = require('readline');
const { checkSSLRequirements, getInstallationInstructions } = require('./check-ssl');
const fs = require('fs');
const path = require('path');

// Check for SSL requirements
const sslCheck = checkSSLRequirements();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

if (sslCheck.hasSSL) {
  // SSL certificates are available, start with HTTPS
  console.log('✅ SSL certificates found. Starting with HTTPS...');
  startSecure();
} else {
  // No SSL certificates, ask user for preference
  console.log('⚠️ SSL certificates are not available.');
  console.log('\n⚠️ WARNING: Stripe and other payment processors require HTTPS for security.');
  console.log('⚠️ Running without SSL is not recommended for payment processing.');
  
  rl.question('\nDo you want to (1) try to install SSL tools, (2) continue without SSL, or (3) abort? [1/2/3]: ', (answer) => {
    switch(answer.trim()) {
      case '1':
        // Show installation instructions
        console.log('\nPlease follow these instructions to install SSL tools:');
        getInstallationInstructions().forEach(line => console.log(`  ${line}`));
        rl.close();
        process.exit(0);
        break;
      
      case '2':
        // Continue without SSL
        console.log('\n⚠️ Starting in non-secure mode. Payment features may not work correctly.');
        // Create marker file to indicate we're in non-secure mode
        fs.writeFileSync(path.join(__dirname, '..', '.non-secure-mode'), 'true');
        startNonSecure();
        rl.close();
        break;
      
      case '3':
      default:
        // Abort
        console.log('Aborting startup.');
        rl.close();
        process.exit(0);
    }
  });
}

function startSecure() {
  try {
    // Remove non-secure mode marker if it exists
    const nonSecurePath = path.join(__dirname, '..', '.non-secure-mode');
    if (fs.existsSync(nonSecurePath)) {
      fs.unlinkSync(nonSecurePath);
    }
    
    // Start with HTTPS
    console.log('🚀 Starting secure development server...');
    execSync('next dev', { stdio: 'inherit' });
  } catch (error) {
    console.error('Error starting server:', error);
  }
}

function startNonSecure() {
  try {
    console.log('🚀 Starting non-secure development server...');
    execSync('next dev', { stdio: 'inherit' });
  } catch (error) {
    console.error('Error starting server:', error);
  }
} 