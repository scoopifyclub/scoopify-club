// Fix database connection string
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Database Connection String\n');

// Read current .env.local
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

// Extract current DATABASE_URL
const dbUrlMatch = envContent.match(/DATABASE_URL="([^"]+)"/);
if (!dbUrlMatch) {
  console.log('❌ DATABASE_URL not found');
  process.exit(1);
}

const currentUrl = dbUrlMatch[1];
console.log('📋 Current URL:', currentUrl);

// Parse the URL to check for issues
try {
  const url = new URL(currentUrl);
  console.log('\n🔍 URL Analysis:');
  console.log('   Protocol:', url.protocol);
  console.log('   Username:', url.username);
  console.log('   Password length:', url.password?.length || 0);
  console.log('   Hostname:', url.hostname);
  console.log('   Port:', url.port || 'default');
  console.log('   Database:', url.pathname.substring(1));
  console.log('   SSL Mode:', url.searchParams.get('sslmode'));
  
  // Check if password needs encoding
  if (url.password) {
    const originalPassword = url.password;
    const encodedPassword = encodeURIComponent(originalPassword);
    
    if (originalPassword !== encodedPassword) {
      console.log('\n⚠️  Password contains special characters that need encoding');
      console.log('   Original:', originalPassword);
      console.log('   Encoded:', encodedPassword);
      
      // Create fixed URL
      const fixedUrl = currentUrl.replace(originalPassword, encodedPassword);
      console.log('\n🔧 Fixed URL:', fixedUrl);
      
      // Update .env.local
      const updatedContent = envContent.replace(currentUrl, fixedUrl);
      fs.writeFileSync(envPath, updatedContent);
      
      console.log('✅ Updated .env.local with encoded password');
      console.log('💡 Try running the connection test again');
      
    } else {
      console.log('\n✅ Password encoding looks correct');
    }
  }
  
} catch (error) {
  console.error('❌ URL parsing failed:', error.message);
}

console.log('\n📋 Alternative Solutions:');
console.log('1. Copy the exact POSTGRES_PRISMA_URL from your Neon dashboard');
console.log('2. Make sure the database name is exactly "Scoopify_Data"');
console.log('3. Check if the password contains special characters');
console.log('4. Try regenerating the connection string in Neon dashboard'); 