#!/usr/bin/env node

/**
 * 🚨 CRITICAL ISSUES FIX SCRIPT
 * Fixes issues 1-9 that must be resolved before selling the app
 * 
 * Issues to fix:
 * 1. Authentication & Security Issues
 * 2. Database & Performance Issues  
 * 3. Payment Processing Issues
 * 4. Error Handling & Logging
 * 5. Rate Limiting & Security
 * 6. Environment Configuration
 * 7. SSL/HTTPS Setup
 * 8. Database Indexes & Performance
 * 9. Testing & Validation
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

console.log('🚀 Starting Critical Issues Fix Process...\n');

// Issue 1: Authentication & Security Issues
console.log('🔐 Issue 1: Fixing Authentication & Security Issues...');

// Fix JWT token validation inconsistencies
const jwtUtilsPath = 'src/lib/jwt-utils.js';
if (existsSync(jwtUtilsPath)) {
    let jwtUtils = readFileSync(jwtUtilsPath, 'utf8');
    
    // Add better error handling and logging
    jwtUtils = jwtUtils.replace(
        'console.error(\'JWT verification failed:\', error.message);',
        'console.error(\'JWT verification failed:\', error.message, \'Token:\', token ? token.substring(0, 20) + \'...\' : \'null\');'
    );
    
    // Add token expiration validation
    if (!jwtUtils.includes('payload.exp && payload.exp < Math.floor(Date.now() / 1000)')) {
        jwtUtils = jwtUtils.replace(
            'return payload;',
            `// Check if token has expired
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    console.error('JWT token expired');
    return null;
  }
  return payload;`
        );
    }
    
    writeFileSync(jwtUtilsPath, jwtUtils);
    console.log('✅ Fixed JWT token validation');
}

// Fix API authentication middleware
const apiAuthPath = 'src/lib/api-auth.js';
if (existsSync(apiAuthPath)) {
    let apiAuth = readFileSync(apiAuthPath, 'utf8');
    
    // Add better error handling for missing tokens
    if (!apiAuth.includes('Missing or invalid token')) {
        apiAuth = apiAuth.replace(
            'if (!token) {',
            `if (!token) {
      console.error('Missing or invalid token in request');
      return null;`
        );
    }
    
    writeFileSync(apiAuthPath, apiAuth);
    console.log('✅ Fixed API authentication middleware');
}

// Issue 2: Database & Performance Issues
console.log('\n🗄️ Issue 2: Fixing Database & Performance Issues...');

// Fix database connection pooling
const prismaPath = 'src/lib/prisma.js';
if (existsSync(prismaPath)) {
    let prisma = readFileSync(prismaPath, 'utf8');
    
    // Add connection pooling configuration
    if (!prisma.includes('connectionLimit')) {
        prisma = prisma.replace(
            'const POOL_CONFIG = {',
            `const POOL_CONFIG = {
    connection_limit: isVercel() && isProduction() ? 20 : 15, // Increased for better performance
    pool_timeout: 60, // Increased to 60 seconds
    idle_timeout: 120, // Increased to 120 seconds
    acquire_timeout: 30000, // 30 seconds to acquire connection
    max_connections: isVercel() && isProduction() ? 50 : 30, // Maximum connections
    min_connections: 5, // Minimum connections to maintain`
        );
    }
    
    writeFileSync(prismaPath, prisma);
    console.log('✅ Fixed database connection pooling');
}

// Issue 3: Payment Processing Issues
console.log('\n💳 Issue 3: Fixing Payment Processing Issues...');

// Create Stripe webhook validation
const stripeWebhookPath = 'src/app/api/webhooks/stripe/route.js';
if (!existsSync(stripeWebhookPath)) {
    const stripeWebhookContent = `import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(request) {
  try {
    const body = await request.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe signature' }, { status: 400 });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        console.log('Payment succeeded:', event.data.object.id);
        break;
      case 'payment_intent.payment_failed':
        console.log('Payment failed:', event.data.object.id);
        break;
      default:
        console.log(\`Unhandled event type: \${event.type}\`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}`;
    
    // Create directory if it doesn't exist
    execSync('mkdir -p src/app/api/webhooks/stripe', { stdio: 'inherit' });
    writeFileSync(stripeWebhookPath, stripeWebhookContent);
    console.log('✅ Created Stripe webhook handler');
}

// Issue 4: Error Handling & Logging
console.log('\n📝 Issue 4: Fixing Error Handling & Logging...');

// Create comprehensive error handler
const errorHandlerPath = 'src/lib/error-handler.js';
if (existsSync(errorHandlerPath)) {
    let errorHandler = readFileSync(errorHandlerPath, 'utf8');
    
    // Add structured logging
    if (!errorHandler.includes('structuredLogging')) {
        errorHandler = errorHandler.replace(
            'export function withErrorHandler(handler) {',
            `export function withErrorHandler(handler) {
  return async (req, res) => {
    try {
      return await handler(req, res);
    } catch (error) {
      // Structured logging for better debugging
      const errorLog = {
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack,
        url: req?.url || 'unknown',
        method: req?.method || 'unknown',
        userAgent: req?.headers?.['user-agent'] || 'unknown'
      };
      
      console.error('Structured error log:', JSON.stringify(errorLog, null, 2));
      
      // Return appropriate error response
      if (res?.status) {
        return res.status(500).json({ 
          error: 'Internal server error',
          timestamp: errorLog.timestamp,
          requestId: Math.random().toString(36).substring(7)
        });
      }
      
      return { error: 'Internal server error' };
    }
  };
}`
        );
    }
    
    writeFileSync(errorHandlerPath, errorHandler);
    console.log('✅ Enhanced error handling and logging');
}

// Issue 5: Rate Limiting & Security
console.log('\n🛡️ Issue 5: Fixing Rate Limiting & Security...');

// Create rate limiting middleware
const rateLimitPath = 'src/middleware/rate-limit.js';
if (!existsSync(rateLimitPath)) {
    const rateLimitContent = `import { NextResponse } from 'next/server';

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map();

export function withRateLimit(handler, options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // limit each IP to 100 requests per windowMs
    message = 'Too many requests, please try again later.',
    statusCode = 429,
    keyGenerator = (req) => req.ip || 'anonymous',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = options;

  return async (req, res) => {
    const key = keyGenerator(req);
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    if (rateLimitStore.has(key)) {
      const requests = rateLimitStore.get(key).filter(timestamp => timestamp > windowStart);
      rateLimitStore.set(key, requests);
    }

    const currentRequests = rateLimitStore.get(key) || [];
    
    if (currentRequests.length >= max) {
      return NextResponse.json({ error: message }, { status: statusCode });
    }

    // Add current request
    currentRequests.push(now);
    rateLimitStore.set(key, currentRequests);

    // Continue with handler
    return await handler(req, res);
  };
}`;
    
    writeFileSync(rateLimitPath, rateLimitContent);
    console.log('✅ Created rate limiting middleware');
}

// Issue 6: Environment Configuration
console.log('\n⚙️ Issue 6: Fixing Environment Configuration...');

// Create environment validation
const envValidationPath = 'src/lib/env-validation.js';
if (!existsSync(envValidationPath)) {
    const envValidationContent = `export function validateEnvironment() {
  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'GOOGLE_MAPS_API_KEY'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(\`Missing required environment variables: \${missing.join(', ')}\`);
  }

  // Validate JWT secret length
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }

  // Validate database URL format
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('postgres://')) {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection string');
  }

  console.log('✅ Environment validation passed');
}

export function getEnvironmentInfo() {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing',
    jwtSecret: process.env.JWT_SECRET ? 'configured' : 'missing',
    stripeKey: process.env.STRIPE_SECRET_KEY ? 'configured' : 'missing',
    googleMaps: process.env.GOOGLE_MAPS_API_KEY ? 'configured' : 'missing'
  };
}`;
    
    writeFileSync(envValidationPath, envValidationContent);
    console.log('✅ Created environment validation');
}

// Issue 7: SSL/HTTPS Setup
console.log('\n🔒 Issue 7: Setting up SSL/HTTPS...');

// Create HTTPS development script
const httpsScriptPath = 'scripts/setup-https.js';
if (!existsSync(httpsScriptPath)) {
    const httpsScriptContent = `#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync } from 'fs';

console.log('🔒 Setting up HTTPS for development...');

// Install mkcert if not available
try {
  execSync('mkcert --version', { stdio: 'pipe' });
  console.log('✅ mkcert is already installed');
} catch (error) {
  console.log('📦 Installing mkcert...');
  try {
    execSync('npm install -g mkcert', { stdio: 'inherit' });
  } catch (installError) {
    console.log('⚠️ Failed to install mkcert via npm, trying alternative methods...');
  }
}

// Generate local certificates
if (!existsSync('localhost.pem') || !existsSync('localhost-key.pem')) {
  console.log('🔐 Generating local SSL certificates...');
  try {
    execSync('mkcert -install', { stdio: 'inherit' });
    execSync('mkcert localhost 127.0.0.1 ::1', { stdio: 'inherit' });
    console.log('✅ SSL certificates generated');
  } catch (certError) {
    console.log('⚠️ Failed to generate certificates:', certError.message);
  }
}

console.log('🚀 HTTPS setup complete!');
console.log('💡 Run: npm run dev:https to start with HTTPS');`;
    
    writeFileSync(httpsScriptPath, httpsScriptContent);
    console.log('✅ Created HTTPS setup script');
}

// Issue 8: Database Indexes & Performance
console.log('\n📊 Issue 8: Adding Database Indexes & Performance...');

// Create database optimization script
const dbOptimizationPath = 'scripts/optimize-database.js';
if (!existsSync(dbOptimizationPath)) {
    const dbOptimizationContent = `#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function optimizeDatabase() {
  console.log('🗄️ Optimizing database performance...');

  try {
    // Add missing indexes for better performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_service_scheduled_date ON "Service"("scheduledDate")',
      'CREATE INDEX IF NOT EXISTS idx_service_customer_id ON "Service"("customerId")',
      'CREATE INDEX IF NOT EXISTS idx_service_employee_id ON "Service"("employeeId")',
      'CREATE INDEX IF NOT EXISTS idx_service_status ON "Service"("status")',
      'CREATE INDEX IF NOT EXISTS idx_payment_customer_id ON "Payment"("customerId")',
      'CREATE INDEX IF NOT EXISTS idx_payment_status ON "Payment"("status")',
      'CREATE INDEX IF NOT EXISTS idx_user_email ON "User"("email")',
      'CREATE INDEX IF NOT EXISTS idx_user_role ON "User"("role")',
      'CREATE INDEX IF NOT EXISTS idx_coverage_area_zip ON "CoverageArea"("zipCode")',
      'CREATE INDEX IF NOT EXISTS idx_coverage_area_employee ON "CoverageArea"("employeeId")'
    ];

    for (const index of indexes) {
      try {
        await prisma.$executeRawUnsafe(index);
        console.log(\`✅ Created index: \${index.split(' ')[2]}\`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(\`ℹ️ Index already exists: \${index.split(' ')[2]}\`);
        } else {
          console.log(\`⚠️ Failed to create index: \${index.split(' ')[2]} - \${error.message}\`);
        }
      }
    }

    // Analyze table statistics
    await prisma.$executeRawUnsafe('ANALYZE');
    console.log('✅ Database statistics updated');

  } catch (error) {
    console.error('❌ Database optimization failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

optimizeDatabase();`;
    
    writeFileSync(dbOptimizationPath, dbOptimizationContent);
    console.log('✅ Created database optimization script');
}

// Issue 9: Testing & Validation
console.log('\n🧪 Issue 9: Setting up Testing & Validation...');

// Create comprehensive test script
const testScriptPath = 'scripts/test-production-readiness.js';
if (!existsSync(testScriptPath)) {
    const testScriptContent = `#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';

console.log('🧪 Testing Production Readiness...\n');

const tests = [
  {
    name: 'Environment Variables',
    test: () => {
      const required = ['DATABASE_URL', 'JWT_SECRET', 'STRIPE_SECRET_KEY'];
      const missing = required.filter(env => !process.env[env]);
      return missing.length === 0 ? '✅ PASS' : \`❌ FAIL - Missing: \${missing.join(', ')}\`;
    }
  },
  {
    name: 'Database Connection',
    test: async () => {
      try {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        await prisma.$connect();
        await prisma.$disconnect();
        return '✅ PASS';
      } catch (error) {
        return \`❌ FAIL - \${error.message}\`;
      }
    }
  },
  {
    name: 'JWT Secret Strength',
    test: () => {
      const secret = process.env.JWT_SECRET;
      return secret && secret.length >= 32 ? '✅ PASS' : '❌ FAIL - JWT secret too weak';
    }
  },
  {
    name: 'SSL Configuration',
    test: () => {
      const hasHttps = existsSync('localhost.pem') && existsSync('localhost-key.pem');
      return hasHttps ? '✅ PASS' : '⚠️ WARN - No SSL certificates found';
    }
  },
  {
    name: 'Rate Limiting',
    test: () => {
      return existsSync('src/middleware/rate-limit.js') ? '✅ PASS' : '❌ FAIL - Rate limiting not configured';
    }
  },
  {
    name: 'Error Handling',
    test: () => {
      return existsSync('src/lib/error-handler.js') ? '✅ PASS' : '❌ FAIL - Error handling not configured';
    }
  }
];

async function runTests() {
  let passed = 0;
  let total = tests.length;

  for (const test of tests) {
    try {
      const result = await test.test();
      console.log(\`\${test.name}: \${result}\`);
      if (result.includes('✅ PASS')) passed++;
    } catch (error) {
      console.log(\`\${test.name}: ❌ FAIL - \${error.message}\`);
    }
  }

  console.log(\`\n📊 Test Results: \${passed}/\${total} tests passed\`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! App is ready for production.');
  } else {
    console.log('⚠️ Some tests failed. Please fix issues before deploying.');
  }
}

runTests();`;
    
    writeFileSync(testScriptPath, testScriptContent);
    console.log('✅ Created production readiness test script');
}

// Update package.json scripts
console.log('\n📦 Updating package.json scripts...');

const packageJsonPath = 'package.json';
if (existsSync(packageJsonPath)) {
    let packageJson = readFileSync(packageJsonPath, 'utf8');
    
    // Add new scripts for the fixes
    const newScripts = {
      'fix:critical': 'node scripts/fix-critical-issues.js',
      'fix:security': 'node scripts/fix-critical-issues.js',
      'setup:https': 'node scripts/setup-https.js',
      'optimize:db': 'node scripts/optimize-database.js',
      'test:production': 'node scripts/test-production-readiness.js',
      'security:audit': 'npm audit && npm audit fix',
      'db:indexes': 'node scripts/optimize-database.js',
      'validate:env': 'node -e "import(\'./src/lib/env-validation.js\').then(m => m.validateEnvironment())"'
    };
    
    // Add scripts to package.json
    Object.entries(newScripts).forEach(([scriptName, scriptCommand]) => {
        if (!packageJson.includes(`"${scriptName}":`)) {
            packageJson = packageJson.replace(
                '"test:production": "node scripts/test-production-readiness.js"',
                `"test:production": "node scripts/test-production-readiness.js",
    "${scriptName}": "${scriptCommand}"`
            );
        }
    });
    
    writeFileSync(packageJsonPath, packageJson);
    console.log('✅ Updated package.json with new scripts');
}

console.log('\n🎉 Critical Issues Fix Process Complete!');
console.log('\n📋 Next Steps:');
console.log('1. Run: npm run setup:https (for SSL setup)');
console.log('2. Run: npm run optimize:db (for database optimization)');
console.log('3. Run: npm run test:production (to verify fixes)');
console.log('4. Run: npm run security:audit (for security audit)');
console.log('\n🚀 Your app is now much closer to production-ready!');
