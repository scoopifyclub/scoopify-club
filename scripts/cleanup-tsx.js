const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all .tsx files in the src/app directory
const tsxFiles = glob.sync('src/app/**/*.tsx');

// Delete each .tsx file
tsxFiles.forEach(file => {
  const jsxFile = file.replace('.tsx', '.jsx');
  
  // Only delete if the .jsx version exists
  if (fs.existsSync(jsxFile)) {
    console.log(`Deleting ${file} (${jsxFile} exists)`);
    fs.unlinkSync(file);
  } else {
    console.log(`Skipping ${file} (no matching .jsx file)`);
  }
});

console.log('Cleanup complete!'); 