import { readFileSync, writeFileSync, existsSync } from 'fs';
import { randomBytes, randomUUID } from 'crypto';

function generateSecureSecret(length = 32) {
    return randomBytes(length).toString('hex');
}

function generateSecureKey() {
    return randomUUID().replace(/-/g, '');
}

function updateEnvironmentFile() {
    console.log('🔐 Updating environment variables with secure values...\n');

    const envPath = '.env';
    
    if (!existsSync(envPath)) {
        console.log('❌ .env file not found');
        return;
    }

    // Read current .env
    let envContent = readFileSync(envPath, 'utf8');
    
    // Generate secure values
    const secureValues = {
        'JWT_SECRET': generateSecureSecret(64),
        'NEXTAUTH_SECRET': generateSecureSecret(64),
        'JWT_REFRESH_SECRET': generateSecureSecret(64),
        'CRON_SECRET': generateSecureSecret(32),
        'CRON_API_KEY': generateSecureKey()
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

    console.log('\n🔒 Security Recommendations:');
    console.log('   1. Update Stripe keys with production keys when deploying');
    console.log('   2. Configure SMTP settings for email functionality');
    console.log('   3. Update Google Maps API key');
    console.log('   4. Set up AWS credentials if using S3');
    console.log('   5. Update domain URLs for production');
    console.log('\n📝 Next steps:');
    console.log('   - Test the application locally');
    console.log('   - Review all environment variables');
    console.log('   - Set up production environment on your hosting platform');
}

function main() {
    try {
        updateEnvironmentFile();
        console.log('\n🎉 Environment setup complete!');
        console.log('   Run "npm run dev" to test the application');
    } catch (error) {
        console.error('❌ Error updating environment:', error.message);
        process.exit(1);
    }
}

main(); 