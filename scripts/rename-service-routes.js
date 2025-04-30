const fs = require('fs');
const path = require('path');

function renameServiceIdFolders(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            if (item === '[serviceId]') {
                const newPath = path.join(dir, '[id]');
                fs.renameSync(fullPath, newPath);
                console.log(`Renamed: ${fullPath} -> ${newPath}`);
            } else {
                renameServiceIdFolders(fullPath);
            }
        }
    }
}

// Start from the src directory
const srcDir = path.join(process.cwd(), 'src');
console.log('Starting rename process...');
renameServiceIdFolders(srcDir);
console.log('Rename process completed.'); 