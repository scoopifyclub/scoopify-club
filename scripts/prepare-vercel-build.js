const fs = require('fs');
const path = require('path');

console.log('Preparing build environment for Vercel...');

// Create a simpler postcss.config.js for Vercel
const vercelPostcssConfig = `
module.exports = {
  plugins: {
    // Skip autoprefixer for Vercel builds to avoid the dependency issue
    // autoprefixer: {},
    'tailwindcss/nesting': {},
    tailwindcss: {},
  }
};
`;

fs.writeFileSync(path.join(process.cwd(), 'postcss.config.js'), vercelPostcssConfig);
console.log('Modified postcss.config.js for Vercel deployment');

// Log environment for debugging
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Build preparation complete!'); 