import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

async function updateEmailImports() {
    console.log('🔧 Updating email imports...\n');

    // Find all files that import from the old email file
    const files = await glob('src/**/*.{js,jsx,ts,tsx}');
    
    for (const file of files) {
        console.log(`Processing: ${file}`);
        
        let content = readFileSync(file, 'utf8');
        let modified = false;
        
        // Update imports from '@/lib/email' to '@/lib/email-service'
        if (content.includes("from '@/lib/email'") || content.includes("from './email'") || content.includes("from '../lib/email'")) {
            console.log('  Updating email import');
            content = content.replace(/from ['"]@\/lib\/email['"]/g, "from '@/lib/email-service'");
            content = content.replace(/from ['"]\.\/email['"]/g, "from './email-service'");
            content = content.replace(/from ['"]\.\.\/lib\/email['"]/g, "from '../lib/email-service'");
            modified = true;
        }
        
        if (modified) {
            writeFileSync(file, content, 'utf8');
            console.log(`  ✅ Updated: ${file}`);
        } else {
            console.log(`  ✅ No changes needed`);
        }
    }
    
    console.log('\n🎉 Email imports update completed!');
}

updateEmailImports().catch(console.error); 