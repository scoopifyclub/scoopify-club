#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

async function fixPrismaImports() {
  try {
    console.log('🔧 Fixing Prisma import statements...');
    
    // Find all JavaScript and TypeScript files
    const files = await glob('src/**/*.{js,jsx,ts,tsx}', {
      cwd: join(__dirname, '..'),
      absolute: true
    });
    
    let fixedCount = 0;
    
    for (const file of files) {
      try {
        const content = readFileSync(file, 'utf8');
        
        // Check if file contains the incorrect import
        if (content.includes("import prisma from '@/lib/prisma'")) {
          // Replace the import statement
          const newContent = content.replace(
            /import prisma from ['"]@\/lib\/prisma['"];?/g,
            "import { prisma } from '@/lib/prisma';"
          );
          
          // Only write if content changed
          if (newContent !== content) {
            writeFileSync(file, newContent, 'utf8');
            console.log(`✅ Fixed: ${file.replace(join(__dirname, '..'), '')}`);
            fixedCount++;
          }
        }
      } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Fixed ${fixedCount} files with incorrect Prisma imports`);
    
  } catch (error) {
    console.error('❌ Error fixing Prisma imports:', error);
    process.exit(1);
  }
}

fixPrismaImports(); 