const { execSync } = require('child_process');

// Start Next.js without SSL
console.log('Starting Next.js development server without SSL...');
try {
  execSync('next dev', { stdio: 'inherit' });
} catch (error) {
  console.error('Error starting Next.js:', error);
} 