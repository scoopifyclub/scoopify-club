#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Function to add runtime directive to a file
function addRuntimeDirective(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check if runtime directive already exists
        if (content.includes('export const runtime = \'nodejs\'')) {
            console.log(`✅ ${filePath} - Already has runtime directive`);
            return false;
        }
        
        // Check if file imports prisma
        if (!content.includes('import') || !content.includes('prisma')) {
            console.log(`⏭️  ${filePath} - No prisma import, skipping`);
            return false;
        }
        
        // Find the last import statement
        const lines = content.split('\n');
        let lastImportIndex = -1;
        
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim().startsWith('import ')) {
                lastImportIndex = i;
            }
        }
        
        if (lastImportIndex === -1) {
            console.log(`⚠️  ${filePath} - No import statements found`);
            return false;
        }
        
        // Insert runtime directive after the last import
        const runtimeDirective = [
            '',
            '// Force Node.js runtime for Prisma and other Node.js APIs',
            'export const runtime = \'nodejs\';',
            ''
        ];
        
        lines.splice(lastImportIndex + 1, 0, ...runtimeDirective);
        
        // Write the file back
        fs.writeFileSync(filePath, lines.join('\n'));
        console.log(`✅ ${filePath} - Added runtime directive`);
        return true;
        
    } catch (error) {
        console.error(`❌ ${filePath} - Error: ${error.message}`);
        return false;
    }
}

// Main function
async function main() {
    console.log('🔧 Fixing API runtime issues...\n');
    
    // Find all API route files
    const apiFiles = glob.sync('src/app/api/**/*.js');
    
    let fixedCount = 0;
    let totalCount = 0;
    
    for (const file of apiFiles) {
        totalCount++;
        if (addRuntimeDirective(file)) {
            fixedCount++;
        }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`Total API files: ${totalCount}`);
    console.log(`Files fixed: ${fixedCount}`);
    console.log(`Files already correct: ${totalCount - fixedCount}`);
    
    if (fixedCount > 0) {
        console.log(`\n🎉 Successfully fixed ${fixedCount} API files!`);
    } else {
        console.log(`\n✨ All API files are already properly configured!`);
    }
}

// Run the script
main().catch(console.error);
