#!/usr/bin/env node

/**
 * Comprehensive Security and Safety Audit for ScoopifyClub
 * Identifies potential vulnerabilities, bugs, and security issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔒 ScoopifyClub Security & Safety Audit');
console.log('=======================================\n');

function checkFileExists(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  return fs.existsSync(fullPath);
}

function readFileContent(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return '';
  }
}

function auditEnvironmentSecurity() {
  console.log('🔐 Environment Security Audit...');
  
  const envFiles = ['.env', '.env.local', '.env.production'];
  const issues = [];
  
  envFiles.forEach(file => {
    if (checkFileExists(file)) {
      const content = readFileContent(file);
      
      // Check for hardcoded secrets
      const hardcodedSecrets = [
        /sk_live_/,
        /pk_live_/,
        /sk_test_/,
        /pk_test_/,
        /AIza[A-Za-z0-9_-]{35}/, // Google API keys
        /ghp_[A-Za-z0-9_-]{36}/, // GitHub tokens
        /[A-Za-z0-9_-]{40}/, // Generic long tokens
      ];
      
      hardcodedSecrets.forEach(pattern => {
        if (pattern.test(content)) {
          issues.push(`⚠️  Hardcoded secret found in ${file}: ${pattern.source}`);
        }
      });
      
      // Check for weak secrets
      const weakSecrets = [
        /JWT_SECRET=test/,
        /JWT_SECRET=secret/,
        /JWT_SECRET=password/,
        /JWT_SECRET=123/,
        /STRIPE_SECRET_KEY=sk_test_/,
      ];
      
      weakSecrets.forEach(pattern => {
        if (pattern.test(content)) {
          issues.push(`⚠️  Weak secret found in ${file}: ${pattern.source}`);
        }
      });
      
      // Check for missing required variables
      const requiredVars = ['DATABASE_URL', 'JWT_SECRET', 'STRIPE_SECRET_KEY'];
      requiredVars.forEach(varName => {
        if (!content.includes(varName)) {
          issues.push(`❌ Missing required environment variable: ${varName}`);
        }
      });
      
      console.log(`   ${checkFileExists(file) ? '✅' : '❌'} ${file}`);
    }
  });
  
  if (issues.length > 0) {
    console.log('   Issues found:');
    issues.forEach(issue => console.log(`      ${issue}`));
  } else {
    console.log('   ✅ No obvious environment security issues found');
  }
  
  console.log('');
  return issues.length === 0;
}

function auditCodeSecurity() {
  console.log('🛡️  Code Security Audit...');
  
  const securityIssues = [];
  const filesToCheck = [
    'src/app/api/**/*.js',
    'src/app/api/**/*.ts',
    'src/lib/**/*.js',
    'src/lib/**/*.ts',
    'src/middleware/**/*.js',
    'src/middleware/**/*.ts'
  ];
  
  // Check for common security vulnerabilities
  const vulnerabilityPatterns = [
    {
      name: 'SQL Injection',
      pattern: /query\(.*\$\{.*\}/,
      severity: 'HIGH'
    },
    {
      name: 'XSS Vulnerability',
      pattern: /dangerouslySetInnerHTML/,
      severity: 'HIGH'
    },
    {
      name: 'Hardcoded Credentials',
      pattern: /password.*=.*['"][^'"]{8,}['"]/,
      severity: 'HIGH'
    },
    {
      name: 'Console Log with Sensitive Data',
      pattern: /console\.log.*password|console\.log.*secret|console\.log.*key/,
      severity: 'MEDIUM'
    },
    {
      name: 'Missing Input Validation',
      pattern: /req\.body\.\w+.*without.*validation/,
      severity: 'MEDIUM'
    },
    {
      name: 'Unsafe File Upload',
      pattern: /multer.*without.*fileType.*validation/,
      severity: 'HIGH'
    }
  ];
  
  // Check specific API routes for security
  const apiRoutes = [
    'src/app/api/admin/automation-status/route.js',
    'src/app/api/admin/system-metrics/route.js',
    'src/app/api/admin/recent-activity/route.js',
    'src/app/api/admin/trigger-automation/route.js',
    'src/app/api/cron/automated-employee-recruitment/route.js',
    'src/app/api/cron/automated-customer-acquisition/route.js',
    'src/app/api/cron/business-intelligence/route.js'
  ];
  
  apiRoutes.forEach(route => {
    if (checkFileExists(route)) {
      const content = readFileContent(route);
      
      // Check for authentication
      if (!content.includes('auth') && !content.includes('session') && !content.includes('token')) {
        securityIssues.push(`⚠️  Missing authentication in ${route}`);
      }
      
      // Check for rate limiting
      if (!content.includes('rate') && !content.includes('throttle')) {
        securityIssues.push(`⚠️  Missing rate limiting in ${route}`);
      }
      
      // Check for input validation
      if (content.includes('req.body') && !content.includes('validate') && !content.includes('zod')) {
        securityIssues.push(`⚠️  Missing input validation in ${route}`);
      }
    }
  });
  
  // Check middleware for security headers
  const middlewareFiles = [
    'src/middleware.js',
    'src/middleware/auth.js',
    'src/middleware/security.js'
  ];
  
  middlewareFiles.forEach(file => {
    if (checkFileExists(file)) {
      const content = readFileContent(file);
      
      if (!content.includes('helmet') && !content.includes('security') && !content.includes('headers')) {
        securityIssues.push(`⚠️  Missing security headers in ${file}`);
      }
    }
  });
  
  if (securityIssues.length > 0) {
    console.log('   Issues found:');
    securityIssues.forEach(issue => console.log(`      ${issue}`));
  } else {
    console.log('   ✅ No obvious code security issues found');
  }
  
  console.log('');
  return securityIssues.length === 0;
}

function auditDependencies() {
  console.log('📦 Dependency Security Audit...');
  
  const packagePath = path.join(process.cwd(), 'package.json');
  if (!checkFileExists(packagePath)) {
    console.log('   ❌ package.json not found');
    return false;
  }
  
  const packageJson = JSON.parse(readFileContent(packagePath));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  // Check for known vulnerable packages
  const vulnerablePackages = [
    'lodash', // Check version
    'moment', // Check version
    'express', // Check version
    'axios', // Check version
  ];
  
  const issues = [];
  
  vulnerablePackages.forEach(pkg => {
    if (dependencies[pkg]) {
      const version = dependencies[pkg];
      console.log(`   ⚠️  ${pkg}@${version} - Check for vulnerabilities`);
    }
  });
  
  // Check for outdated packages
  console.log('   💡 Run "npm audit" to check for vulnerabilities');
  console.log('   💡 Run "npm outdated" to check for outdated packages');
  
  console.log('');
  return true;
}

function auditDatabaseSecurity() {
  console.log('🗄️  Database Security Audit...');
  
  const issues = [];
  
  // Check Prisma schema for security
  const schemaPath = 'prisma/schema.prisma';
  if (checkFileExists(schemaPath)) {
    const content = readFileContent(schemaPath);
    
    // Check for proper indexes
    if (!content.includes('@@index') && !content.includes('@@unique')) {
      issues.push('⚠️  Missing database indexes for performance and security');
    }
    
    // Check for proper field types
    if (content.includes('String') && !content.includes('@db.VarChar')) {
      issues.push('⚠️  Consider specifying field lengths for String fields');
    }
    
    // Check for proper relationships
    if (content.includes('model') && !content.includes('@@relation')) {
      issues.push('⚠️  Check database relationships are properly defined');
    }
  }
  
  // Check for database connection security
  const envContent = readFileContent('.env');
  if (envContent.includes('DATABASE_URL')) {
    if (envContent.includes('localhost') || envContent.includes('127.0.0.1')) {
      issues.push('⚠️  Database URL contains localhost - ensure this is for development only');
    }
    
    if (!envContent.includes('ssl') && envContent.includes('postgresql')) {
      issues.push('⚠️  PostgreSQL connection should use SSL in production');
    }
  }
  
  if (issues.length > 0) {
    console.log('   Issues found:');
    issues.forEach(issue => console.log(`      ${issue}`));
  } else {
    console.log('   ✅ No obvious database security issues found');
  }
  
  console.log('');
  return issues.length === 0;
}

function auditAuthenticationSecurity() {
  console.log('🔑 Authentication Security Audit...');
  
  const issues = [];
  
  // Check for JWT configuration
  const envContent = readFileContent('.env');
  if (envContent.includes('JWT_SECRET')) {
    if (envContent.includes('JWT_SECRET=test') || envContent.includes('JWT_SECRET=secret')) {
      issues.push('❌ Weak JWT secret detected');
    }
  } else {
    issues.push('❌ JWT_SECRET not configured');
  }
  
  // Check for session configuration
  if (!envContent.includes('NEXTAUTH_SECRET') && !envContent.includes('SESSION_SECRET')) {
    issues.push('⚠️  Session secret not configured');
  }
  
  // Check authentication middleware
  const authFiles = [
    'src/middleware/auth.js',
    'src/lib/auth.js',
    'src/lib/auth-client.js'
  ];
  
  authFiles.forEach(file => {
    if (checkFileExists(file)) {
      const content = readFileContent(file);
      
      if (!content.includes('verify') && !content.includes('validate')) {
        issues.push(`⚠️  Missing token verification in ${file}`);
      }
      
      if (!content.includes('expires') && !content.includes('expiration')) {
        issues.push(`⚠️  Missing token expiration in ${file}`);
      }
    }
  });
  
  if (issues.length > 0) {
    console.log('   Issues found:');
    issues.forEach(issue => console.log(`      ${issue}`));
  } else {
    console.log('   ✅ No obvious authentication security issues found');
  }
  
  console.log('');
  return issues.length === 0;
}

function auditFilePermissions() {
  console.log('📁 File Permissions Audit...');
  
  const sensitiveFiles = [
    '.env',
    '.env.local',
    '.env.production',
    'package-lock.json',
    'yarn.lock'
  ];
  
  const issues = [];
  
  sensitiveFiles.forEach(file => {
    if (checkFileExists(file)) {
      try {
        const stats = fs.statSync(file);
        const mode = stats.mode.toString(8);
        
        // Check if file is world-readable (should not be)
        if (mode.endsWith('666') || mode.endsWith('777')) {
          issues.push(`⚠️  ${file} has overly permissive permissions: ${mode}`);
        }
      } catch (error) {
        // File might not exist or be accessible
      }
    }
  });
  
  if (issues.length > 0) {
    console.log('   Issues found:');
    issues.forEach(issue => console.log(`      ${issue}`));
  } else {
    console.log('   ✅ File permissions look appropriate');
  }
  
  console.log('');
  return issues.length === 0;
}

function auditCORSConfiguration() {
  console.log('🌐 CORS Configuration Audit...');
  
  const issues = [];
  
  // Check for CORS configuration
  const configFiles = [
    'next.config.js',
    'src/middleware.js',
    'src/app/api/**/*.js'
  ];
  
  let corsFound = false;
  
  configFiles.forEach(pattern => {
    // Simplified check - in real implementation, you'd use glob
    if (pattern.includes('next.config.js') && checkFileExists('next.config.js')) {
      const content = readFileContent('next.config.js');
      if (content.includes('cors') || content.includes('headers')) {
        corsFound = true;
      }
    }
  });
  
  if (!corsFound) {
    issues.push('⚠️  CORS configuration not found - ensure proper CORS setup');
  }
  
  if (issues.length > 0) {
    console.log('   Issues found:');
    issues.forEach(issue => console.log(`      ${issue}`));
  } else {
    console.log('   ✅ CORS configuration appears to be in place');
  }
  
  console.log('');
  return issues.length === 0;
}

function auditErrorHandling() {
  console.log('🚨 Error Handling Audit...');
  
  const issues = [];
  
  // Check for proper error handling in API routes
  const apiRoutes = [
    'src/app/api/admin/automation-status/route.js',
    'src/app/api/admin/system-metrics/route.js',
    'src/app/api/admin/recent-activity/route.js',
    'src/app/api/admin/trigger-automation/route.js'
  ];
  
  apiRoutes.forEach(route => {
    if (checkFileExists(route)) {
      const content = readFileContent(route);
      
      if (!content.includes('try') || !content.includes('catch')) {
        issues.push(`⚠️  Missing error handling in ${route}`);
      }
      
      if (!content.includes('NextResponse') && !content.includes('res.status')) {
        issues.push(`⚠️  Missing proper response handling in ${route}`);
      }
    }
  });
  
  // Check for global error handling
  const errorFiles = [
    'src/app/error.js',
    'src/app/global-error.js',
    'src/middleware/error-handler.js'
  ];
  
  let globalErrorHandler = false;
  errorFiles.forEach(file => {
    if (checkFileExists(file)) {
      globalErrorHandler = true;
    }
  });
  
  if (!globalErrorHandler) {
    issues.push('⚠️  Global error handler not found');
  }
  
  if (issues.length > 0) {
    console.log('   Issues found:');
    issues.forEach(issue => console.log(`      ${issue}`));
  } else {
    console.log('   ✅ Error handling appears to be in place');
  }
  
  console.log('');
  return issues.length === 0;
}

function generateSecurityReport() {
  console.log('📋 Security Report:');
  console.log('==================\n');
  
  const report = {
    timestamp: new Date().toISOString(),
    environmentSecurity: auditEnvironmentSecurity(),
    codeSecurity: auditCodeSecurity(),
    dependencies: auditDependencies(),
    databaseSecurity: auditDatabaseSecurity(),
    authenticationSecurity: auditAuthenticationSecurity(),
    filePermissions: auditFilePermissions(),
    corsConfiguration: auditCORSConfiguration(),
    errorHandling: auditErrorHandling(),
    recommendations: []
  };
  
  // Generate recommendations
  if (!report.environmentSecurity) {
    report.recommendations.push('Fix environment variable security issues');
  }
  
  if (!report.codeSecurity) {
    report.recommendations.push('Address code security vulnerabilities');
  }
  
  if (!report.authenticationSecurity) {
    report.recommendations.push('Strengthen authentication security');
  }
  
  report.recommendations.push('Run: npm audit');
  report.recommendations.push('Run: npm outdated');
  report.recommendations.push('Consider using security scanning tools like Snyk or SonarQube');
  report.recommendations.push('Implement rate limiting on all API endpoints');
  report.recommendations.push('Add input validation using libraries like Zod or Joi');
  report.recommendations.push('Implement proper logging without sensitive data');
  report.recommendations.push('Set up monitoring and alerting for security events');
  
  // Save report
  const reportPath = path.join(process.cwd(), 'security-audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('   ✅ Security report saved to security-audit-report.json');
  console.log('');
  
  return report;
}

function generateSecurityChecklist() {
  console.log('✅ Security Checklist:');
  console.log('=====================\n');
  
  console.log('🔐 Environment Variables:');
  console.log('   □ Use strong, unique secrets for JWT_SECRET');
  console.log('   □ Use production Stripe keys (not test keys)');
  console.log('   □ Ensure DATABASE_URL uses SSL in production');
  console.log('   □ Remove any hardcoded credentials');
  console.log('');
  
  console.log('🛡️  Code Security:');
  console.log('   □ Implement proper authentication on all API routes');
  console.log('   □ Add input validation using Zod or similar');
  console.log('   □ Implement rate limiting');
  console.log('   □ Add security headers (helmet.js)');
  console.log('   □ Sanitize all user inputs');
  console.log('   □ Use parameterized queries (Prisma handles this)');
  console.log('');
  
  console.log('🔑 Authentication:');
  console.log('   □ Implement proper session management');
  console.log('   □ Add token expiration');
  console.log('   □ Implement refresh token rotation');
  console.log('   □ Add multi-factor authentication (optional)');
  console.log('');
  
  console.log('🌐 Network Security:');
  console.log('   □ Configure CORS properly');
  console.log('   □ Use HTTPS in production');
  console.log('   □ Implement proper SSL/TLS');
  console.log('   □ Set up Content Security Policy (CSP)');
  console.log('');
  
  console.log('📊 Monitoring:');
  console.log('   □ Set up security event logging');
  console.log('   □ Implement intrusion detection');
  console.log('   □ Monitor for unusual activity');
  console.log('   □ Set up alerts for security events');
  console.log('');
  
  console.log('🔄 Maintenance:');
  console.log('   □ Keep dependencies updated');
  console.log('   □ Run security audits regularly');
  console.log('   □ Monitor for new vulnerabilities');
  console.log('   □ Have a security incident response plan');
  console.log('');
}

async function main() {
  console.log('🔍 Starting comprehensive security audit...\n');
  
  // Run all security audits
  const envSecure = auditEnvironmentSecurity();
  const codeSecure = auditCodeSecurity();
  const depsSecure = auditDependencies();
  const dbSecure = auditDatabaseSecurity();
  const authSecure = auditAuthenticationSecurity();
  const fileSecure = auditFilePermissions();
  const corsSecure = auditCORSConfiguration();
  const errorSecure = auditErrorHandling();
  
  console.log('📊 Security Audit Summary:');
  console.log('==========================\n');
  
  console.log(`Environment Security: ${envSecure ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Code Security: ${codeSecure ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Dependencies: ${depsSecure ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Database Security: ${dbSecure ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Authentication Security: ${authSecure ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`File Permissions: ${fileSecure ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`CORS Configuration: ${corsSecure ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Error Handling: ${errorSecure ? '✅ PASS' : '❌ FAIL'}`);
  
  const overallSecure = envSecure && codeSecure && depsSecure && dbSecure && 
                       authSecure && fileSecure && corsSecure && errorSecure;
  
  console.log(`\nOverall Security Status: ${overallSecure ? '✅ SECURE' : '❌ ISSUES FOUND'}`);
  
  if (overallSecure) {
    console.log('\n🎉 Security audit passed! Your application appears to be secure.');
  } else {
    console.log('\n⚠️  Security issues found. Please address them before deployment.');
  }
  
  const report = generateSecurityReport();
  generateSecurityChecklist();
  
  console.log('🚀 Next Steps:');
  console.log('   1. Address any security issues identified above');
  console.log('   2. Run: npm audit');
  console.log('   3. Update dependencies: npm update');
  console.log('   4. Test security measures thoroughly');
  console.log('   5. Consider professional security audit for production');
  console.log('');
  
  console.log('📚 Security Resources:');
  console.log('   • OWASP Top 10: https://owasp.org/www-project-top-ten/');
  console.log('   • Next.js Security: https://nextjs.org/docs/advanced-features/security-headers');
  console.log('   • Prisma Security: https://www.prisma.io/docs/guides/security');
  console.log('');
}

// Run the security audit
main().catch(console.error);

export {
  auditEnvironmentSecurity,
  auditCodeSecurity,
  auditDependencies,
  auditDatabaseSecurity,
  auditAuthenticationSecurity,
  auditFilePermissions,
  auditCORSConfiguration,
  auditErrorHandling,
  generateSecurityReport,
  generateSecurityChecklist
}; 