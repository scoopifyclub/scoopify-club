import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

console.log('🚀 ScoopifyClub Deployment Readiness Check');
console.log('==========================================\n');

// Check essential files
console.log('📁 Checking essential files...');
const files = [
    ['package.json', 'Package configuration'],
    ['next.config.js', 'Next.js configuration'],
    ['prisma/schema.prisma', 'Database schema'],
    ['.env', 'Environment variables'],
    ['.gitignore', 'Git ignore rules']
];

let allGood = true;
for (const [file, description] of files) {
    if (existsSync(file)) {
        console.log(`✅ ${description}`);
    } else {
        console.log(`❌ ${description}`);
        allGood = false;
    }
}

// Check Git status
console.log('\n🔍 Checking Git status...');
try {
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
    if (gitStatus.trim()) {
        console.log('⚠️  Uncommitted changes detected');
    } else {
        console.log('✅ Working directory is clean');
    }
} catch (error) {
    console.log('❌ Git not initialized');
    allGood = false;
}

// Check environment variables
console.log('\n🔍 Checking environment variables...');
if (existsSync('.env')) {
    const envContent = readFileSync('.env', 'utf8');
    const required = ['DATABASE_URL', 'JWT_SECRET', 'NEXTAUTH_SECRET'];
    for (const varName of required) {
        if (envContent.includes(`${varName}=`)) {
            console.log(`✅ ${varName} is configured`);
        } else {
            console.log(`❌ ${varName} is missing`);
            allGood = false;
        }
    }
} else {
    console.log('❌ .env file not found');
    allGood = false;
}

// Check dependencies
console.log('\n🔍 Checking dependencies...');
try {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    const critical = ['next', 'react', 'react-dom', '@prisma/client'];
    for (const dep of critical) {
        if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
            console.log(`✅ ${dep} is installed`);
        } else {
            console.log(`❌ ${dep} is missing`);
            allGood = false;
        }
    }
} catch (error) {
    console.log('❌ Error reading package.json');
    allGood = false;
}

// Check security
console.log('\n🔍 Checking security...');
try {
    const auditResult = execSync('npm audit --audit-level=moderate --json', { encoding: 'utf8' });
    const audit = JSON.parse(auditResult);
    if (audit.metadata.vulnerabilities.total === 0) {
        console.log('✅ No security vulnerabilities found');
    } else {
        console.log(`⚠️  Found ${audit.metadata.vulnerabilities.total} vulnerabilities`);
    }
} catch (error) {
    console.log('⚠️  Could not run security audit');
}

// Create Vercel config
console.log('\n🔍 Creating Vercel configuration...');
const vercelConfig = {
    version: 2,
    functions: {
        'src/app/api/**/*.js': {
            maxDuration: 30
        }
    },
    cron: [
        {
            path: '/api/cron/create-weekly-services',
            schedule: '0 6 * * 1'
        },
        {
            path: '/api/cron/process-employee-payouts',
            schedule: '0 9 * * 5'
        },
        {
            path: '/api/cron/automated-employee-recruitment',
            schedule: '0 10 * * 1'
        },
        {
            path: '/api/cron/automated-customer-acquisition',
            schedule: '0 11 * * 2'
        },
        {
            path: '/api/cron/business-intelligence',
            schedule: '0 12 * * 1'
        }
    ]
};

writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));
console.log('✅ Created vercel.json configuration');

// Final summary
console.log('\n📊 Deployment Readiness Summary');
console.log('==============================');

if (allGood) {
    console.log('🎉 All checks passed! Your application is ready for deployment.');
    console.log('\n📝 Next steps:');
    console.log('   1. Update environment variables for production');
    console.log('   2. Push to GitHub');
    console.log('   3. Deploy to Vercel');
} else {
    console.log('⚠️  Some checks failed. Please address the issues above before deploying.');
}

console.log('\n📚 Files created:');
console.log('   - vercel.json (Vercel configuration)');
console.log('   - Check DEPLOYMENT_CHECKLIST.md for detailed steps'); 