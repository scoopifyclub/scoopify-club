const fs = require('fs');
const path = require('path');

function updateFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Replace destructured parameter names
        content = content.replace(/const\s*{\s*serviceId\s*}/g, 'const { id }');
        content = content.replace(/params\.serviceId/g, 'params.id');
        
        // Replace route parameters
        content = content.replace(/\[serviceId\]/g, '[id]');
        
        // Replace API endpoints
        content = content.replace(/\/api\/services\/\$\{serviceId\}/g, '/api/services/${id}');
        content = content.replace(/\/api\/employee\/services\/\$\{serviceId\}/g, '/api/employee/services/${id}');
        content = content.replace(/\/api\/customer\/services\/\$\{serviceId\}/g, '/api/customer/services/${id}');
        
        // Replace prop names
        content = content.replace(/serviceId=\{serviceId\}/g, 'serviceId={id}');
        
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error);
    }
}

function processDirectory(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (stat.isFile() && (fullPath.endsWith('.js') || fullPath.endsWith('.jsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.tsx'))) {
            updateFile(fullPath);
        }
    }
}

// Start from the src directory
const srcDir = path.join(process.cwd(), 'src');
console.log('Starting update process...');
processDirectory(srcDir);
console.log('Update process completed.'); 