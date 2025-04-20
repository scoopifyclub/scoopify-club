const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all TypeScript files
const files = execSync('git ls-files "*.ts"', { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);

// Update imports in each file
files.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace imports
  content = content.replace(
    /import\s*{\s*prisma\s*}\s*from\s*['"](.+)\/prisma['"];?/g,
    'import prisma from "$1/prisma";'
  );

  fs.writeFileSync(filePath, content);
}); 