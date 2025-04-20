// Check for required UI components
const fs = require('fs');
const path = require('path');

const REQUIRED_COMPONENTS = [
  'avatar.tsx',
  'badge.tsx',
  'button.tsx',
  'card.tsx',
  'checkbox.tsx',
  'input.tsx',
  'label.tsx',
  'select.tsx',
];

const UI_COMPONENTS_DIR = path.join(__dirname, '..', 'src', 'components', 'ui');

function checkComponents() {
  console.log('Checking for required UI components...');
  
  // Check if the UI components directory exists
  if (!fs.existsSync(UI_COMPONENTS_DIR)) {
    console.error(`UI components directory not found at: ${UI_COMPONENTS_DIR}`);
    return false;
  }

  // Get all files in the UI components directory
  const files = fs.readdirSync(UI_COMPONENTS_DIR);
  
  // Check if all required components exist
  let missingComponents = [];
  for (const component of REQUIRED_COMPONENTS) {
    if (!files.includes(component)) {
      missingComponents.push(component);
    }
  }
  
  if (missingComponents.length > 0) {
    console.error('Missing required UI components:');
    missingComponents.forEach(component => {
      console.error(`- ${component}`);
    });
    return false;
  }
  
  console.log('All required UI components are available!');
  return true;
}

// Run the check
const result = checkComponents();
process.exit(result ? 0 : 1); 