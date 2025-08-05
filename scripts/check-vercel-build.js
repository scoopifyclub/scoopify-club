import { execSync } from 'child_process';

console.log('🚀 Vercel Build Status Checker');
console.log('================================\n');

try {
    // Check if Vercel CLI is installed
    console.log('📋 Checking Vercel CLI...');
    execSync('vercel --version', { stdio: 'pipe' });
    console.log('✅ Vercel CLI is installed\n');
    
    // Get project info
    console.log('🔍 Getting project information...');
    const projectInfo = execSync('vercel ls', { encoding: 'utf8' });
    console.log(projectInfo);
    
    // Get latest deployment
    console.log('📊 Getting latest deployment...');
    const deploymentInfo = execSync('vercel ls --scope=scoopifyclub', { encoding: 'utf8' });
    console.log(deploymentInfo);
    
} catch (error) {
    console.log('❌ Vercel CLI not installed or not authenticated');
    console.log('\n📝 To install Vercel CLI:');
    console.log('   npm i -g vercel');
    console.log('\n🔐 To authenticate:');
    console.log('   vercel login');
    console.log('\n📋 Manual Steps:');
    console.log('1. Go to https://vercel.com/dashboard');
    console.log('2. Find your "scoopify-club" project');
    console.log('3. Check the latest deployment status');
    console.log('4. Review build logs for errors');
    console.log('5. Configure environment variables if needed');
}

console.log('\n🔗 Quick Links:');
console.log('• Vercel Dashboard: https://vercel.com/dashboard');
console.log('• Project URL: https://scoopifyclub.vercel.app');
console.log('• Build Logs: Check in Vercel Dashboard > Deployments');
console.log('• Environment Variables: Vercel Dashboard > Settings > Environment Variables');

console.log('\n📞 If you need help:');
console.log('• Check the troubleshooting guide: docs/DEPLOYMENT_TROUBLESHOOTING.md');
console.log('• Review build logs in Vercel Dashboard');
console.log('• Test locally: npm run build && npm start'); 