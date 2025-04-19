const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

// Detect platform
const platform = os.platform();
const isWindows = platform === 'win32';
const isMac = platform === 'darwin';
const isLinux = platform === 'linux';

// Check if SSL certificates exist
const certsDir = path.join(process.cwd(), 'certs');
const keyPath = path.join(certsDir, 'localhost.key');
const certPath = path.join(certsDir, 'localhost.crt');
const sslExists = fs.existsSync(keyPath) && fs.existsSync(certPath);

// Function to check if a command exists
function commandExists(command) {
  try {
    const cmd = isWindows ? 'where' : 'which';
    execSync(`${cmd} ${command}`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Main check function
function checkSSLRequirements() {
  // SSL certificates already exist, no need for further checks
  if (sslExists) {
    console.log('✅ SSL certificates already exist.');
    return { hasSSL: true };
  }

  // Create certs directory if it doesn't exist
  if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir, { recursive: true });
  }

  // Check if we have OpenSSL
  const hasOpenSSL = commandExists('openssl');
  
  // Check if we have mkcert as an alternative
  const hasMkcert = commandExists('mkcert');

  if (hasOpenSSL) {
    return { hasSSL: false, tool: 'openssl' };
  } else if (hasMkcert) {
    return { hasSSL: false, tool: 'mkcert' };
  } else {
    return { hasSSL: false, tool: null };
  }
}

// Generate installation instructions based on platform
function getInstallationInstructions() {
  if (isWindows) {
    return [
      '1. Install Chocolatey (https://chocolatey.org/install)',
      '2. Run: choco install mkcert',
      '3. Run: mkcert -install',
      '4. Restart your development server'
    ];
  } else if (isMac) {
    return [
      '1. Install Homebrew if not installed (https://brew.sh/)',
      '2. Run: brew install mkcert',
      '3. Run: brew install nss (if you use Firefox)',
      '4. Run: mkcert -install',
      '5. Restart your development server'
    ];
  } else if (isLinux) {
    return [
      '1. For Ubuntu/Debian: sudo apt install libnss3-tools mkcert',
      '   For Fedora: sudo dnf install nss-tools mkcert',
      '2. Run: mkcert -install',
      '3. Restart your development server'
    ];
  } else {
    return [
      'Please install OpenSSL or mkcert on your system.',
      'Visit https://github.com/FiloSottile/mkcert for mkcert installation instructions.'
    ];
  }
}

// Generate certificates with the appropriate tool
function generateCertificates(tool) {
  console.log(`Generating SSL certificates using ${tool}...`);
  try {
    if (tool === 'openssl') {
      execSync(`openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" -subj "/CN=localhost"`, {
        stdio: 'inherit'
      });
    } else if (tool === 'mkcert') {
      execSync(`mkcert -key-file "${keyPath}" -cert-file "${certPath}" localhost 127.0.0.1 ::1`, {
        stdio: 'inherit'
      });
    }
    console.log('✅ SSL certificates generated successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error generating SSL certificates:', error.message);
    return false;
  }
}

// Run checks
const { hasSSL, tool } = checkSSLRequirements();

if (!hasSSL) {
  if (tool) {
    const success = generateCertificates(tool);
    if (!success) {
      console.log('\n❌ Failed to generate SSL certificates.');
      console.log('\nInstructions to set up SSL manually:');
      getInstallationInstructions().forEach(line => console.log(`  ${line}`));
      process.exit(1);
    }
  } else {
    console.log('❌ No SSL certificate generation tools found.');
    console.log('\nInstructions to set up SSL:');
    getInstallationInstructions().forEach(line => console.log(`  ${line}`));
    process.exit(1);
  }
}

module.exports = {
  checkSSLRequirements,
  generateCertificates,
  getInstallationInstructions
}; 