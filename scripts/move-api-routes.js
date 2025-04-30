const fs = require('fs');
const path = require('path');

function moveDirectory(source, destination) {
    if (!fs.existsSync(source)) {
        console.log(`Source directory ${source} does not exist`);
        return;
    }

    // Create destination if it doesn't exist
    if (!fs.existsSync(destination)) {
        fs.mkdirSync(destination, { recursive: true });
    }

    const items = fs.readdirSync(source);
    
    for (const item of items) {
        const sourcePath = path.join(source, item);
        const destPath = path.join(destination, item);
        
        if (fs.statSync(sourcePath).isDirectory()) {
            moveDirectory(sourcePath, destPath);
        } else {
            fs.copyFileSync(sourcePath, destPath);
            console.log(`Copied: ${sourcePath} -> ${destPath}`);
        }
    }
}

const directories = [
    ['src', 'app', 'api', 'services'],
    ['src', 'app', 'employee', 'service'],
    ['src', 'app', 'employee', 'services'],
    ['src', 'app', 'dashboard', 'services'],
    ['src', 'app', 'api', 'employee', 'services'],
    ['src', 'app', 'api', 'customer', 'services']
];

console.log('Starting move process...');

directories.forEach(dirPath => {
    const fullPath = path.join(process.cwd(), ...dirPath);
    const sourceDir = path.join(fullPath, '[serviceId]');
    const destDir = path.join(fullPath, '[id]');
    
    if (fs.existsSync(sourceDir)) {
        console.log(`Processing ${sourceDir}...`);
        moveDirectory(sourceDir, destDir);
        
        // After successful move, try to remove the source directory
        try {
            fs.rmSync(sourceDir, { recursive: true, force: true });
            console.log(`Removed: ${sourceDir}`);
        } catch (error) {
            console.error(`Failed to remove ${sourceDir}:`, error);
        }
    }
});

console.log('Move process completed.'); 