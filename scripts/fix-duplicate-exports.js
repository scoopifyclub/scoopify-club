import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

async function fixDuplicateExports() {
    console.log('🔧 Fixing duplicate export declarations...\n');

    const adminRoutes = await glob('src/app/api/admin/**/route.js');
    
    for (const file of adminRoutes) {
        console.log(`Processing: ${file}`);
        
        let content = readFileSync(file, 'utf8');
        let modified = false;
        
        // Check for duplicate export declarations
        const exportMatches = content.match(/export const (GET|POST|PUT|DELETE) = withApiSecurity\(/g);
        
        if (exportMatches && exportMatches.length > 1) {
            console.log(`  Found ${exportMatches.length} export declarations`);
            
            // Keep only the first occurrence of each export type
            const seenExports = new Set();
            const lines = content.split('\n');
            const newLines = [];
            
            for (const line of lines) {
                const exportMatch = line.match(/export const (GET|POST|PUT|DELETE) = withApiSecurity\(/);
                
                if (exportMatch) {
                    const exportType = exportMatch[1];
                    
                    if (seenExports.has(exportType)) {
                        console.log(`  Removing duplicate: ${exportType}`);
                        continue; // Skip duplicate
                    } else {
                        seenExports.add(exportType);
                        console.log(`  Keeping: ${exportType}`);
                    }
                }
                
                newLines.push(line);
            }
            
            content = newLines.join('\n');
            modified = true;
        }
        
        if (modified) {
            writeFileSync(file, content, 'utf8');
            console.log(`  ✅ Fixed: ${file}`);
        } else {
            console.log(`  ✅ No duplicates found`);
        }
    }
    
    console.log('\n🎉 Duplicate export fix completed!');
}

fixDuplicateExports().catch(console.error); 