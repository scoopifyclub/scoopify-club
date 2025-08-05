import { readFileSync, writeFileSync, existsSync, statSync } from 'fs';
import { execSync } from 'child_process';

function log(message, type = 'info') {
    const colors = {
        success: '\x1b[32m',
        error: '\x1b[31m',
        warning: '\x1b[33m',
        info: '\x1b[36m',
        reset: '\x1b[0m'
    };
    console.log(`${colors[type]}${message}${colors.reset}`);
}

function checkFileExists(path, description) {
    if (existsSync(path)) {
        log(`✅ ${description}`, 'success');
        return true;
    } else {
        log(`❌ ${description}`, 'error');
        return false;
    }
}

function checkGitStatus() {
    log('\n🔍 Checking Git status...', 'info');
    
    try {
        const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
        if (gitStatus.trim()) {
            log('⚠️  Uncommitted changes detected:', 'warning');
            console.log(gitStatus);
        } else {
            log('✅ Working directory is clean', 'success');
        }
        
        const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
        log(`📋 Current branch: ${currentBranch}`, 'info');
        
        return true;
    } catch (error) {
        log('❌ Git not initialized or error occurred', 'error');
        return false;
    }
}

function checkEnvironmentVariables() {
    log('\n🔍 Checking environment variables...', 'info');
    
    const envPath = '.env';
    if (!existsSync(envPath)) {
        log('❌ .env file not found', 'error');
        return false;
    }
    
    const envContent = readFileSync(envPath, 'utf8');
    const requiredVars = [
        'DATABASE_URL',
        'JWT_SECRET',
        'NEXTAUTH_SECRET',
        'NEXTAUTH_URL'
    ];
    
    let allPresent = true;
    for (const varName of requiredVars) {
        if (envContent.includes(`${varName}=`)) {
            log(`✅ ${varName} is configured`, 'success');
        } else {
            log(`❌ ${varName} is missing`, 'error');
            allPresent = false;
        }
    }
    
    // Check for placeholder values
    const placeholderPatterns = [
        /your-jwt-secret/,
        /your-nextauth-secret/,
        /your-stripe-secret-key/,
        /your-google-maps-api-key/
    ];
    
    for (const pattern of placeholderPatterns) {
        if (pattern.test(envContent)) {
            log(`⚠️  Found placeholder value: ${pattern.source}`, 'warning');
        }
    }
    
    return allPresent;
}

function checkDependencies() {
    log('\n🔍 Checking dependencies...', 'info');
    
    try {
        const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
        
        // Check for critical dependencies
        const criticalDeps = ['next', 'react', 'react-dom', '@prisma/client'];
        for (const dep of criticalDeps) {
            if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
                log(`✅ ${dep} is installed`, 'success');
            } else {
                log(`❌ ${dep} is missing`, 'error');
            }
        }
        
        // Check for security vulnerabilities
        try {
            const auditResult = execSync('npm audit --audit-level=moderate --json', { encoding: 'utf8' });
            const audit = JSON.parse(auditResult);
            if (audit.metadata.vulnerabilities.total === 0) {
                log('✅ No security vulnerabilities found', 'success');
            } else {
                log(`⚠️  Found ${audit.metadata.vulnerabilities.total} vulnerabilities`, 'warning');
            }
        } catch (error) {
            log('⚠️  Could not run security audit', 'warning');
        }
        
        return true;
    } catch (error) {
        log('❌ Error reading package.json', 'error');
        return false;
    }
}

function checkDatabaseConnection() {
    log('\n🔍 Checking database connection...', 'info');
    
    try {
        // Try to run a simple Prisma command
        execSync('npx prisma db pull --print', { stdio: 'pipe' });
        log('✅ Database connection successful', 'success');
        return true;
    } catch (error) {
        log('❌ Database connection failed', 'error');
        log('   Make sure your DATABASE_URL is correct and database is accessible', 'warning');
        return false;
    }
}

function checkBuildProcess() {
    log('\n🔍 Checking build process...', 'info');
    
    try {
        execSync('npm run build', { stdio: 'pipe' });
        log('✅ Build process successful', 'success');
        return true;
    } catch (error) {
        log('❌ Build process failed', 'error');
        return false;
    }
}

function createVercelConfig() {
    log('\n🔍 Creating Vercel configuration...', 'info');
    
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
        ],
        headers: [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY'
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff'
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin'
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block'
                    }
                ]
            }
        ]
    };
    
    writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));
    log('✅ Created vercel.json configuration', 'success');
}

function createDeploymentChecklist() {
    log('\n🔍 Creating deployment checklist...', 'info');
    
    const checklist = `# Deployment Checklist

## Pre-Deployment
- [ ] Environment variables configured for production
- [ ] Database migrations applied
- [ ] Security audit completed
- [ ] Build process tested
- [ ] All tests passing

## Production Environment Variables
Make sure to set these in your hosting platform:

### Required
- DATABASE_URL (production database)
- JWT_SECRET (secure random string)
- NEXTAUTH_SECRET (secure random string)
- NEXTAUTH_URL (your production domain)

### Optional but Recommended
- STRIPE_SECRET_KEY (production Stripe key)
- STRIPE_PUBLISHABLE_KEY (production Stripe key)
- SMTP_HOST, SMTP_USER, SMTP_PASSWORD (for email)
- GOOGLE_MAPS_API_KEY (for maps functionality)

## Deployment Steps
1. Push code to GitHub
2. Connect repository to Vercel
3. Configure environment variables in Vercel
4. Deploy
5. Test all functionality
6. Set up monitoring and alerts

## Post-Deployment
- [ ] Test all user flows
- [ ] Verify automation systems
- [ ] Check admin dashboard
- [ ] Monitor error logs
- [ ] Set up backup procedures

## Security Checklist
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] Rate limiting active
- [ ] Authentication working
- [ ] No sensitive data in logs
- [ ] Database backups configured

## Monitoring
- [ ] Error tracking set up
- [ ] Performance monitoring active
- [ ] Uptime monitoring configured
- [ ] Alert system in place

Generated on: ${new Date().toISOString()}
`;
    
    writeFileSync('DEPLOYMENT_CHECKLIST.md', checklist);
    log('✅ Created DEPLOYMENT_CHECKLIST.md', 'success');
}

function main() {
    log('🚀 ScoopifyClub Deployment Readiness Check', 'info');
    log('==========================================', 'info');
    
    let allChecksPassed = true;
    
    // Check essential files
    log('\n📁 Checking essential files...', 'info');
    const essentialFiles = [
        ['package.json', 'Package configuration'],
        ['next.config.js', 'Next.js configuration'],
        ['prisma/schema.prisma', 'Database schema'],
        ['.env', 'Environment variables'],
        ['.gitignore', 'Git ignore rules']
    ];
    
    for (const [file, description] of essentialFiles) {
        if (!checkFileExists(file, description)) {
            allChecksPassed = false;
        }
    }
    
    // Run checks
    if (!checkGitStatus()) allChecksPassed = false;
    if (!checkEnvironmentVariables()) allChecksPassed = false;
    if (!checkDependencies()) allChecksPassed = false;
    if (!checkDatabaseConnection()) allChecksPassed = false;
    if (!checkBuildProcess()) allChecksPassed = false;
    
    // Create deployment files
    createVercelConfig();
    createDeploymentChecklist();
    
    // Final summary
    log('\n📊 Deployment Readiness Summary', 'info');
    log('==============================', 'info');
    
    if (allChecksPassed) {
        log('🎉 All checks passed! Your application is ready for deployment.', 'success');
        log('\n📝 Next steps:', 'info');
        log('   1. Review DEPLOYMENT_CHECKLIST.md', 'info');
        log('   2. Update environment variables for production', 'info');
        log('   3. Push to GitHub', 'info');
        log('   4. Deploy to Vercel or your preferred platform', 'info');
    } else {
        log('⚠️  Some checks failed. Please address the issues above before deploying.', 'warning');
        log('\n🔧 Fix the issues and run this script again.', 'info');
    }
    
    log('\n📚 Additional Resources:', 'info');
    log('   - DEPLOYMENT_CHECKLIST.md (detailed checklist)', 'info');
    log('   - vercel.json (Vercel configuration)', 'info');
    log('   - SECURITY_GUIDE.md (security best practices)', 'info');
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
} 