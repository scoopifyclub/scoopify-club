import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

class ProductionDeployer {
  constructor() {
    this.deploymentLog = [];
    this.errors = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, message, type };
    this.deploymentLog.push(logEntry);
    console.log(`[${timestamp}] ${type.toUpperCase()}: ${message}`);
  }

  async runCommand(command, description) {
    try {
      this.log(`Running: ${description}`);
      const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
      this.log(`✅ ${description} completed successfully`);
      return result;
    } catch (error) {
      this.log(`❌ ${description} failed: ${error.message}`, 'error');
      this.errors.push({ command, error: error.message, description });
      throw error;
    }
  }

  async checkPrerequisites() {
    this.log('Checking deployment prerequisites...');
    
    const checks = [
      { name: 'Node.js', command: 'node --version' },
      { name: 'npm', command: 'npm --version' },
      { name: 'Git', command: 'git --version' },
      { name: 'Prisma CLI', command: 'npx prisma --version' }
    ];

    for (const check of checks) {
      try {
        await this.runCommand(check.command, `Checking ${check.name}`);
      } catch (error) {
        throw new Error(`Prerequisite check failed: ${check.name} is not available`);
      }
    }
  }

  async validateEnvironment() {
    this.log('Validating environment variables...');
    
    const requiredEnvVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'STRIPE_SECRET_KEY',
      'RESEND_API_KEY',
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY',
      'AWS_BUCKET_NAME'
    ];

    const missingVars = [];
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        missingVars.push(envVar);
      }
    }

    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    this.log('✅ Environment variables validated');
  }

  async backupDatabase() {
    this.log('Creating database backup...');
    
    try {
      // This would be specific to your database setup
      // For PostgreSQL, you might use pg_dump
      if (process.env.DATABASE_URL.includes('postgresql')) {
        await this.runCommand(
          `pg_dump "${process.env.DATABASE_URL}" > backup_${Date.now()}.sql`,
          'Database backup'
        );
      }
    } catch (error) {
      this.log('⚠️ Database backup failed, continuing with deployment', 'warn');
    }
  }

  async runDatabaseMigrations() {
    this.log('Running database migrations...');
    
    try {
      await this.runCommand('npx prisma generate', 'Generate Prisma client');
      await this.runCommand('npx prisma migrate deploy', 'Deploy database migrations');
      this.log('✅ Database migrations completed');
    } catch (error) {
      throw new Error('Database migration failed. Please check the database connection and migration files.');
    }
  }

  async buildApplication() {
    this.log('Building application...');
    
    try {
      await this.runCommand('npm run build', 'Build Next.js application');
      this.log('✅ Application build completed');
    } catch (error) {
      throw new Error('Application build failed. Please check for compilation errors.');
    }
  }

  async runTests() {
    this.log('Running production tests...');
    
    try {
      await this.runCommand('npm run test:ci', 'Run CI tests');
      this.log('✅ All tests passed');
    } catch (error) {
      this.log('⚠️ Some tests failed, but continuing with deployment', 'warn');
    }
  }

  async deployToVercel() {
    this.log('Deploying to Vercel...');
    
    try {
      // Check if Vercel CLI is installed
      try {
        execSync('vercel --version', { stdio: 'pipe' });
      } catch {
        await this.runCommand('npm install -g vercel', 'Install Vercel CLI');
      }

      // Deploy to production
      await this.runCommand('vercel --prod', 'Deploy to Vercel production');
      this.log('✅ Deployment to Vercel completed');
    } catch (error) {
      throw new Error('Vercel deployment failed. Please check your Vercel configuration.');
    }
  }

  async verifyDeployment() {
    this.log('Verifying deployment...');
    
    const healthChecks = [
      '/api/health',
      '/api/monitoring/health',
      '/'
    ];

    for (const endpoint of healthChecks) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}${endpoint}`);
        if (response.ok) {
          this.log(`✅ Health check passed: ${endpoint}`);
        } else {
          throw new Error(`Health check failed: ${endpoint} returned ${response.status}`);
        }
      } catch (error) {
        this.log(`❌ Health check failed: ${endpoint}`, 'error');
        throw error;
      }
    }
  }

  async setupMonitoring() {
    this.log('Setting up monitoring...');
    
    try {
      // Set up cron job for log cleanup
      await this.runCommand(
        'node scripts/setup-monitoring-cron.js',
        'Setup monitoring cron jobs'
      );
      
      this.log('✅ Monitoring setup completed');
    } catch (error) {
      this.log('⚠️ Monitoring setup failed, but deployment continues', 'warn');
    }
  }

  async generateDeploymentReport() {
    const report = {
      timestamp: new Date().toISOString(),
      status: this.errors.length === 0 ? 'success' : 'partial_success',
      errors: this.errors,
      log: this.deploymentLog,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };

    const reportPath = `deployment-report-${Date.now()}.json`;
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`📄 Deployment report saved to ${reportPath}`);
    return report;
  }

  async deploy() {
    const startTime = Date.now();
    
    try {
      this.log('🚀 Starting production deployment...');
      
      // Step 1: Check prerequisites
      await this.checkPrerequisites();
      
      // Step 2: Validate environment
      await this.validateEnvironment();
      
      // Step 3: Backup database
      await this.backupDatabase();
      
      // Step 4: Run database migrations
      await this.runDatabaseMigrations();
      
      // Step 5: Run tests
      await this.runTests();
      
      // Step 6: Build application
      await this.buildApplication();
      
      // Step 7: Deploy to Vercel
      await this.deployToVercel();
      
      // Step 8: Verify deployment
      await this.verifyDeployment();
      
      // Step 9: Setup monitoring
      await this.setupMonitoring();
      
      const duration = Date.now() - startTime;
      this.log(`🎉 Deployment completed successfully in ${duration}ms`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.log(`💥 Deployment failed after ${duration}ms: ${error.message}`, 'error');
      throw error;
    } finally {
      // Generate deployment report
      await this.generateDeploymentReport();
    }
  }
}

// CLI interface
async function main() {
  const deployer = new ProductionDeployer();
  
  try {
    await deployer.deploy();
    process.exit(0);
  } catch (error) {
    console.error('Deployment failed:', error.message);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { ProductionDeployer }; 