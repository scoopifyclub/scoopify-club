const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const certsDir = path.join(process.cwd(), 'certs');

// Create certs directory if it doesn't exist
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true });
}

// Generate private key and certificate
const keyPath = path.join(certsDir, 'localhost.key');
const certPath = path.join(certsDir, 'localhost.crt');

if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  console.log('Generating SSL certificates...');
  try {
    execSync(`openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" -subj "/CN=localhost"`, {
      stdio: 'inherit'
    });
    console.log('SSL certificates generated successfully!');
  } catch (error) {
    console.error('Error generating SSL certificates:', error);
    process.exit(1);
  }
} else {
  console.log('SSL certificates already exist.');
} 