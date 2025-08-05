import { readFileSync, writeFileSync, existsSync } from 'fs';
import { randomBytes, randomUUID } from 'crypto';
import { join } from 'path';

function generateSecureSecret(length = 32) {
    return randomBytes(length).toString('hex');
}

function generateSecureKey() {
    return randomUUID().replace(/-/g, '');
}

function updateEnvironmentFile() {
    console.log('🔐 Updating environment variables with secure values...\n');

    const envPath = '.env';
    const envLocalPath = '.env.local';
    
    // Check if .env exists
    if (!existsSync(envPath)) {
        console.log('❌ .env file not found. Creating from template...');
        const templatePath = 'secure.env.example';
        if (existsSync(templatePath)) {
            const template = readFileSync(templatePath, 'utf8');
            writeFileSync(envPath, template);
            console.log('✅ Created .env from template');
        } else {
            console.log('❌ secure.env.example not found. Please create .env manually.');
            return;
        }
    }

    // Read current .env
    let envContent = readFileSync(envPath, 'utf8');
    
    // Generate secure values
    const secureValues = {
        'JWT_SECRET': generateSecureSecret(64),
        'NEXTAUTH_SECRET': generateSecureSecret(64),
        'ENCRYPTION_KEY': generateSecureSecret(32),
        'SESSION_SECRET': generateSecureSecret(64),
        'API_KEY': generateSecureKey(),
        'CSP_NONCE': generateSecureKey()
    };

    // Update environment variables
    let updated = false;
    for (const [key, value] of Object.entries(secureValues)) {
        const regex = new RegExp(`^${key}=.*$`, 'm');
        if (regex.test(envContent)) {
            envContent = envContent.replace(regex, `${key}="${value}"`);
            console.log(`✅ Updated ${key}`);
            updated = true;
        } else {
            // Add if not exists
            envContent += `\n${key}="${value}"`;
            console.log(`✅ Added ${key}`);
            updated = true;
        }
    }

    // Update other critical values
    const criticalUpdates = {
        'NODE_ENV': 'development',
        'DEBUG_MODE': 'false',
        'LOG_LEVEL': 'info',
        'AUTOMATION_ENABLED': 'true',
        'MONITORING_ENABLED': 'true',
        'RATE_LIMIT_MAX_REQUESTS': '100',
        'RATE_LIMIT_WINDOW_MS': '60000'
    };

    for (const [key, value] of Object.entries(criticalUpdates)) {
        const regex = new RegExp(`^${key}=.*$`, 'm');
        if (regex.test(envContent)) {
            envContent = envContent.replace(regex, `${key}="${value}"`);
            console.log(`✅ Updated ${key} to "${value}"`);
            updated = true;
        }
    }

    // Write updated .env
    if (updated) {
        writeFileSync(envPath, envContent);
        console.log('\n✅ Environment file updated successfully!');
    } else {
        console.log('\nℹ️  No updates needed for environment file.');
    }

    // Check .env.local
    if (existsSync(envLocalPath)) {
        console.log('\n⚠️  .env.local file found. Please review it for sensitive data:');
        console.log('   - Remove any hardcoded secrets');
        console.log('   - Update with production values if needed');
        console.log('   - Ensure it\'s not committed to git');
    }

    console.log('\n🔒 Security Recommendations:');
    console.log('   1. Update DATABASE_URL with your actual database credentials');
    console.log('   2. Replace Stripe keys with production keys when deploying');
    console.log('   3. Configure SMTP settings for email functionality');
    console.log('   4. Set up monitoring and analytics keys');
    console.log('   5. Update domain URLs for production');
    console.log('\n📝 Next steps:');
    console.log('   - Test the application locally');
    console.log('   - Review all environment variables');
    console.log('   - Set up production environment on your hosting platform');
}

function checkFilePermissions() {
    console.log('\n🔐 Checking file permissions...');
    
    const files = ['.env', '.env.local', 'package-lock.json'];
    
    for (const file of files) {
        if (existsSync(file)) {
            try {
                const stats = readFileSync(file, 'utf8');
                console.log(`✅ ${file} is readable`);
            } catch (error) {
                console.log(`❌ ${file} has permission issues: ${error.message}`);
            }
        }
    }
}

function main() {
    try {
        updateEnvironmentFile();
        checkFilePermissions();
        
        console.log('\n🎉 Environment setup complete!');
        console.log('   Run "npm run dev" to test the application');
        
    } catch (error) {
        console.error('❌ Error updating environment:', error.message);
        process.exit(1);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
} 