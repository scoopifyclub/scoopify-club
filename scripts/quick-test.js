#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

class QuickTest {
  constructor() {
    this.errors = [];
  }

  log(message, type = 'info') {
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} ${message}`);
  }

  async runCommand(command, description) {
    try {
      this.log(`Running: ${description}`);
      execSync(command, { 
        encoding: 'utf8', 
        stdio: 'inherit',
        cwd: join(__dirname, '..')
      });
      this.log(`Success: ${description}`, 'success');
      return true;
    } catch (error) {
      this.log(`Failed: ${description}`, 'error');
      this.errors.push({ command, description, error: error.message });
      return false;
    }
  }

  async runQuickTests() {
    this.log('🚀 Running quick local tests for Vercel/Neon deployment...');
    
    const tests = [
      { command: 'npm run lint', description: 'Linting check' },
      { command: 'npm run build', description: 'Build test' },
      { command: 'npx prisma generate', description: 'Prisma client generation' },
      { command: 'npx prisma db push --skip-generate', description: 'Database schema sync' }
    ];

    for (const test of tests) {
      const success = await this.runCommand(test.command, test.description);
      if (!success) {
        this.log('❌ Quick test failed - fix issues before Git upload', 'error');
        process.exit(1);
      }
    }

    this.log('✅ Quick tests passed! Ready for Git upload', 'success');
    this.log('💡 Run "npm run test:local" for comprehensive testing', 'info');
  }
}

const quickTest = new QuickTest();
quickTest.runQuickTests(); 