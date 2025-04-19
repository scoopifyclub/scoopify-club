// This script is kept for compatibility with existing npm scripts
// It simply uses our new cross-platform SSL checker

const { checkSSLRequirements } = require('./check-ssl');

// The check-ssl.js file already runs the checks when required
console.log('SSL certificate check completed.'); 