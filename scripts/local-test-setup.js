#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

class LocalTestSetup {
  constructor() {
    this.testResults = [];
    this.errors = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
    
    this.testResults.push({
      timestamp,
      type,
      message
    });
  }

  async runCommand(command, description) {
    try {
      this.log(`Running: ${description}`);
      const result = execSync(command, { 
        encoding: 'utf8', 
        stdio: 'pipe',
        cwd: join(__dirname, '..')
      });
      this.log(`Success: ${description}`, 'success');
      return { success: true, output: result };
    } catch (error) {
      this.log(`Failed: ${description} - ${error.message}`, 'error');
      this.errors.push({ command, description, error: error.message });
      return { success: false, error: error.message };
    }
  }

  async checkEnvironment() {
    this.log('🔍 Checking environment setup...');
    
    // Check Node.js version
    const nodeVersion = process.version;
    this.log(`Node.js version: ${nodeVersion}`);
    
    if (!nodeVersion.startsWith('v20')) {
      this.log('Warning: Node.js 20+ recommended for optimal performance', 'error');
    }

    // Check if .env exists
    const envPath = join(__dirname, '..', '.env');
    if (!existsSync(envPath)) {
      this.log('Creating .env from .env.example...');
      const envExample = readFileSync(join(__dirname, '..', '.env.example'), 'utf8');
      writeFileSync(envPath, envExample);
      this.log('Created .env file - please configure your environment variables', 'success');
    } else {
      this.log('.env file exists', 'success');
    }

    // Check package.json
    const packagePath = join(__dirname, '..', 'package.json');
    if (existsSync(packagePath)) {
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
      this.log(`Package: ${packageJson.name} v${packageJson.version}`, 'success');
    }
  }

  async installDependencies() {
    this.log('📦 Installing dependencies...');
    
    // Check if node_modules exists
    const nodeModulesPath = join(__dirname, '..', 'node_modules');
    if (!existsSync(nodeModulesPath)) {
      await this.runCommand('npm install', 'Installing npm dependencies');
    } else {
      this.log('node_modules exists, checking for updates...');
      await this.runCommand('npm install', 'Updating dependencies');
    }

    // Install Playwright browsers if needed
    await this.runCommand('npx playwright install --with-deps', 'Installing Playwright browsers');
  }

  async setupDatabase() {
    this.log('🗄️ Setting up database...');
    
    // Generate Prisma client
    await this.runCommand('npx prisma generate', 'Generating Prisma client');
    
    // Check database connection
    await this.runCommand('npx prisma db push --skip-generate', 'Pushing database schema');
    
    // Run any pending migrations
    await this.runCommand('npx prisma migrate deploy', 'Running database migrations');
  }

  async runLinting() {
    this.log('🔍 Running linting checks...');
    await this.runCommand('npm run lint', 'Running ESLint');
  }

  async runUnitTests() {
    this.log('🧪 Running unit tests...');
    await this.runCommand('npm test', 'Running Jest tests');
  }

  async runE2ETests() {
    this.log('🌐 Running end-to-end tests...');
    await this.runCommand('npm run test:e2e', 'Running Playwright tests');
  }

  async runLoadTests() {
    this.log('⚡ Running load tests...');
    await this.runCommand('npm run test:load', 'Running load tests');
  }

  async buildApplication() {
    this.log('🏗️ Building application...');
    await this.runCommand('npm run build', 'Building Next.js application');
  }

  async startLocalServer() {
    this.log('🚀 Starting local development server...');
    
    // Start server in background
    const serverProcess = execSync('npm run dev', { 
      encoding: 'utf8', 
      stdio: 'pipe',
      cwd: join(__dirname, '..'),
      detached: true
    });
    
    this.log('Development server started', 'success');
    
    // Wait a moment for server to start
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    return serverProcess;
  }

  async testAPIEndpoints() {
    this.log('🔗 Testing API endpoints...');
    
    const endpoints = [
      { url: 'http://localhost:3000/api/health', name: 'Health Check' },
      { url: 'http://localhost:3000/api/monitoring/health', name: 'Monitoring Health' },
      { url: 'http://localhost:3000/api/monitoring/metrics', name: 'Monitoring Metrics' },
      { url: 'http://localhost:3000/api/plans', name: 'Plans API' },
      { url: 'http://localhost:3000/api/prices', name: 'Prices API' }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint.url);
        if (response.ok) {
          this.log(`✅ ${endpoint.name}: ${response.status}`, 'success');
        } else {
          this.log(`❌ ${endpoint.name}: ${response.status}`, 'error');
        }
      } catch (error) {
        this.log(`❌ ${endpoint.name}: Connection failed`, 'error');
      }
    }
  }

  async checkVercelCompatibility() {
    this.log('☁️ Checking Vercel compatibility...');
    
    // Check if vercel.json exists
    const vercelPath = join(__dirname, '..', 'vercel.json');
    if (!existsSync(vercelPath)) {
      this.log('Creating vercel.json configuration...');
      const vercelConfig = {
        "buildCommand": "npm run vercel-build",
        "outputDirectory": ".next",
        "framework": "nextjs",
        "installCommand": "npm install",
        "devCommand": "npm run dev",
        "functions": {
          "src/app/api/**/*.js": {
            "runtime": "nodejs20.x"
          }
        }
      };
      writeFileSync(vercelPath, JSON.stringify(vercelConfig, null, 2));
      this.log('Created vercel.json', 'success');
    }

    // Check build compatibility
    await this.runCommand('npm run build', 'Testing Vercel build process');
  }

  async checkNeonCompatibility() {
    this.log('🦄 Checking Neon database compatibility...');
    
    // Test database connection with Neon
    await this.runCommand('npx prisma db push --skip-generate', 'Testing Neon connection');
    
    // Check if we can run migrations
    await this.runCommand('npx prisma migrate deploy', 'Testing Neon migrations');
  }

  async generateTestReport() {
    this.log('📊 Generating test report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.testResults.length,
        success: this.testResults.filter(r => r.type === 'success').length,
        errors: this.testResults.filter(r => r.type === 'error').length,
        warnings: this.testResults.filter(r => r.type === 'warning').length
      },
      results: this.testResults,
      errors: this.errors,
      recommendations: []
    };

    // Add recommendations based on errors
    if (this.errors.length > 0) {
      report.recommendations.push('Fix all errors before deploying to production');
    }

    if (report.summary.errors === 0) {
      report.recommendations.push('✅ All tests passed! Ready for deployment');
    }

    // Write report to file
    const reportPath = join(__dirname, '..', 'test-results', 'local-test-report.json');
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`Test report saved to: ${reportPath}`, 'success');
    
    return report;
  }

  async runFullTestSuite() {
    this.log('🚀 Starting comprehensive local testing suite...');
    
    try {
      // Environment setup
      await this.checkEnvironment();
      await this.installDependencies();
      
      // Database setup
      await this.setupDatabase();
      
      // Code quality
      await this.runLinting();
      
      // Testing
      await this.runUnitTests();
      await this.runE2ETests();
      await this.runLoadTests();
      
      // Build and compatibility
      await this.buildApplication();
      await this.checkVercelCompatibility();
      await this.checkNeonCompatibility();
      
      // Local server testing
      await this.startLocalServer();
      await this.testAPIEndpoints();
      
      // Generate report
      const report = await this.generateTestReport();
      
      this.log('🎉 Local testing suite completed!', 'success');
      this.log(`📊 Results: ${report.summary.success}/${report.summary.total} tests passed`);
      
      if (report.summary.errors > 0) {
        this.log(`❌ ${report.summary.errors} errors found - please fix before deployment`, 'error');
        process.exit(1);
      } else {
        this.log('✅ All tests passed! Ready for Git upload and Vercel deployment', 'success');
      }
      
    } catch (error) {
      this.log(`Fatal error during testing: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run the test suite
const tester = new LocalTestSetup();
tester.runFullTestSuite(); 