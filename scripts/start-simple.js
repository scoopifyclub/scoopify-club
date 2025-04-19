const { execSync } = require('child_process');

console.log('Starting Next.js development server...');
try {
  execSync('next dev', { stdio: 'inherit' });
} catch (error) {
  console.error('Error starting Next.js:', error);
} 