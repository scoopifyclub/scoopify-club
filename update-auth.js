/**
 * This script helps update API route files 
 * to replace Next-Auth with our custom authentication system
 * 
 * Run with:
 * node update-auth.js
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Path to API routes
const API_ROUTES_DIR = path.join(__dirname, 'src', 'app', 'api');

// Template for the custom auth code
const CUSTOM_AUTH_IMPORT = `import { validateUser } from '@/lib/auth';
import { cookies } from 'next/headers';`;

const NEXT_AUTH_IMPORT_PATTERNS = [
  `import { getServerSession } from 'next-auth';`,
  `import { authOptions } from '@/lib/auth';`
];

const SESSION_AUTH_PATTERN = `const session = await getServerSession(authOptions);`;

const CUSTOM_AUTH_CODE = `// Get access token from cookies
const cookieStore = await cookies();
const accessToken = cookieStore.get('accessToken')?.value;

if (!accessToken) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Validate the token and check role
const { userId, role } = await validateUser(accessToken);`;

const SESSION_CHECK_PATTERN = `if (!session || session.user.role !== 'ADMIN') {`;
const CUSTOM_AUTH_CHECK = `if (role !== 'ADMIN') {`;

// Function to recursively find API route files
function findApiRouteFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findApiRouteFiles(filePath, fileList);
    } else if (file === 'route.ts' || file === 'route.js') {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to update a file
function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Check if the file uses Next-Auth
  if (!NEXT_AUTH_IMPORT_PATTERNS.some(pattern => content.includes(pattern))) {
    return false;
  }
  
  console.log(`Updating file: ${filePath}`);
  
  // Replace imports
  NEXT_AUTH_IMPORT_PATTERNS.forEach(pattern => {
    if (content.includes(pattern)) {
      content = content.replace(pattern, '');
      modified = true;
    }
  });
  
  // Add our custom imports
  if (!content.includes('validateUser')) {
    const importIndex = content.indexOf('import');
    const nextImportIndex = content.indexOf('import', importIndex + 1);
    
    if (nextImportIndex > 0) {
      content = content.slice(0, nextImportIndex) + CUSTOM_AUTH_IMPORT + '\n' + content.slice(nextImportIndex);
    } else {
      const importSection = content.substring(0, content.indexOf('\n\n'));
      content = importSection + '\n' + CUSTOM_AUTH_IMPORT + content.substring(importSection.length);
    }
    modified = true;
  }
  
  // Replace session authentication
  if (content.includes(SESSION_AUTH_PATTERN)) {
    content = content.replace(SESSION_AUTH_PATTERN, CUSTOM_AUTH_CODE);
    modified = true;
  }
  
  // Replace session role checks
  if (content.includes(SESSION_CHECK_PATTERN)) {
    content = content.replace(SESSION_CHECK_PATTERN, CUSTOM_AUTH_CHECK);
    modified = true;
  }
  
  // Replace session.user.id with userId
  content = content.replace(/session\.user\.id/g, 'userId');
  content = content.replace(/session\.user\.role/g, 'role');
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    return true;
  }
  
  return false;
}

// Main function
function main() {
  const routeFiles = findApiRouteFiles(API_ROUTES_DIR);
  let updatedFiles = 0;
  
  routeFiles.forEach(file => {
    if (updateFile(file)) {
      updatedFiles++;
    }
  });
  
  console.log(`Updated ${updatedFiles} of ${routeFiles.length} files.`);
}

main(); 