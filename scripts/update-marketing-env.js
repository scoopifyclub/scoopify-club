import { readFileSync, writeFileSync, existsSync } from 'fs';
import { randomBytes, randomUUID } from 'crypto';

function generateSecureSecret(length = 32) {
    return randomBytes(length).toString('hex');
}

function generateSecureKey() {
    return randomUUID().replace(/-/g, '');
}

function updateMarketingEnvironment() {
    console.log('📧 Updating marketing and growth environment variables...\n');

    const envPath = '.env';

    if (!existsSync(envPath)) {
        console.log('❌ .env file not found');
        return;
    }

    // Read current .env
    let envContent = readFileSync(envPath, 'utf8');

    // Marketing and Growth environment variables
    const marketingVars = {
        // Namecheap Email Configuration
        'NAMECHEAP_SMTP_HOST': 'mail.privateemail.com',
        'NAMECHEAP_SMTP_PORT': '587',
        'NAMECHEAP_EMAIL_USER': 'support@scoopifyclub.com',
        'NAMECHEAP_EMAIL_PASS': 'YOUR_NAMECHEAP_EMAIL_PASSWORD',

        // SEO Verification Codes
        'GOOGLE_VERIFICATION': 'YOUR_GOOGLE_SEARCH_CONSOLE_VERIFICATION_CODE',
        'YANDEX_VERIFICATION': 'YOUR_YANDEX_VERIFICATION_CODE',
        'YAHOO_VERIFICATION': 'YOUR_YAHOO_VERIFICATION_CODE',

        // Social Media Integration
        'FACEBOOK_APP_ID': 'YOUR_FACEBOOK_APP_ID',
        'TWITTER_CREATOR': '@scoopifyclub',
        'LINKEDIN_COMPANY_ID': 'YOUR_LINKEDIN_COMPANY_ID',

        // Analytics
        'GOOGLE_ANALYTICS_ID': 'G-XXXXXXXXXX',
        'GOOGLE_TAG_MANAGER_ID': 'GTM-XXXXXXX',

        // Referral System
        'REFERRAL_BONUS_SCOOPER': '25.00',
        'REFERRAL_BONUS_BUSINESS': '50.00',
        'REFERRAL_PERCENTAGE_SCOOPER': '10',
        'REFERRAL_PERCENTAGE_BUSINESS': '15',

        // Email Templates
        'EMAIL_FROM_NAME': 'Scoopify Club',
        'EMAIL_FROM_ADDRESS': 'support@scoopifyclub.com',
        'EMAIL_REPLY_TO': 'support@scoopifyclub.com'
    };

    // Update environment variables
    let updated = false;
    for (const [key, value] of Object.entries(marketingVars)) {
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

    // Write updated .env
    if (updated) {
        writeFileSync(envPath, envContent);
        console.log('\n✅ Marketing environment variables updated successfully!');
    } else {
        console.log('\nℹ️  No updates needed for marketing environment variables.');
    }

    console.log('\n📋 Marketing & Growth Setup Instructions:');
    console.log('   1. Update NAMECHEAP_EMAIL_PASS with your actual Namecheap email password');
    console.log('   2. Get Google Search Console verification code and update GOOGLE_VERIFICATION');
    console.log('   3. Set up Google Analytics and update GOOGLE_ANALYTICS_ID');
    console.log('   4. Configure social media accounts and update respective IDs');
    console.log('   5. Test email functionality with a test email');
    console.log('   6. Verify SEO setup with Google Search Console');
    console.log('\n🎯 Next steps:');
    console.log('   - Test referral system with sample data');
    console.log('   - Send test emails to verify Namecheap integration');
    console.log('   - Monitor SEO performance in Google Search Console');
    console.log('   - Set up automated email campaigns');
}

function main() {
    try {
        updateMarketingEnvironment();
        console.log('\n🎉 Marketing & Growth environment setup complete!');
    } catch (error) {
        console.error('❌ Error updating marketing environment:', error.message);
        process.exit(1);
    }
}

main(); 