import fetch from 'node-fetch';
import { performance } from 'perf_hooks';

class LoadTester {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.results = [];
    this.errors = [];
  }

  async makeRequest(endpoint, options = {}) {
    const start = performance.now();
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        ...options
      });

      const end = performance.now();
      const duration = end - start;

      return {
        endpoint,
        status: response.status,
        duration,
        success: response.ok,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      const end = performance.now();
      const duration = end - start;

      this.errors.push({
        endpoint,
        error: error.message,
        duration,
        timestamp: new Date().toISOString()
      });

      return {
        endpoint,
        status: 0,
        duration,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async runConcurrentRequests(endpoints, concurrency = 10) {
    console.log(`Running ${endpoints.length} requests with concurrency of ${concurrency}...`);
    
    const batches = [];
    for (let i = 0; i < endpoints.length; i += concurrency) {
      batches.push(endpoints.slice(i, i + concurrency));
    }

    for (const batch of batches) {
      const promises = batch.map(endpoint => this.makeRequest(endpoint));
      const batchResults = await Promise.all(promises);
      this.results.push(...batchResults);
      
      // Small delay between batches to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  async runStressTest(endpoint, duration = 60, requestsPerSecond = 10) {
    console.log(`Running stress test on ${endpoint} for ${duration} seconds at ${requestsPerSecond} req/s...`);
    
    const startTime = Date.now();
    const endTime = startTime + (duration * 1000);
    const interval = 1000 / requestsPerSecond;

    while (Date.now() < endTime) {
      const requestStart = Date.now();
      await this.makeRequest(endpoint);
      
      const requestDuration = Date.now() - requestStart;
      const delay = Math.max(0, interval - requestDuration);
      
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  async runSpikeTest(endpoint, baseLoad = 5, spikeLoad = 50, duration = 30) {
    console.log(`Running spike test on ${endpoint}...`);
    
    // Normal load
    await this.runStressTest(endpoint, duration / 3, baseLoad);
    
    // Spike load
    await this.runStressTest(endpoint, duration / 3, spikeLoad);
    
    // Return to normal load
    await this.runStressTest(endpoint, duration / 3, baseLoad);
  }

  generateReport() {
    const successfulRequests = this.results.filter(r => r.success);
    const failedRequests = this.results.filter(r => !r.success);
    
    const durations = successfulRequests.map(r => r.duration);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);
    const p95Duration = this.percentile(durations, 95);
    const p99Duration = this.percentile(durations, 99);

    const report = {
      summary: {
        totalRequests: this.results.length,
        successfulRequests: successfulRequests.length,
        failedRequests: failedRequests.length,
        successRate: (successfulRequests.length / this.results.length * 100).toFixed(2) + '%',
        errorRate: (failedRequests.length / this.results.length * 100).toFixed(2) + '%'
      },
      performance: {
        averageResponseTime: avgDuration.toFixed(2) + 'ms',
        minResponseTime: minDuration.toFixed(2) + 'ms',
        maxResponseTime: maxDuration.toFixed(2) + 'ms',
        p95ResponseTime: p95Duration.toFixed(2) + 'ms',
        p99ResponseTime: p99Duration.toFixed(2) + 'ms'
      },
      errors: this.errors.slice(0, 10), // Show first 10 errors
      timestamp: new Date().toISOString()
    };

    return report;
  }

  percentile(array, p) {
    const sorted = array.sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  }

  printReport() {
    const report = this.generateReport();
    
    console.log('\n' + '='.repeat(60));
    console.log('LOAD TEST RESULTS');
    console.log('='.repeat(60));
    
    console.log('\n📊 SUMMARY:');
    console.log(`Total Requests: ${report.summary.totalRequests}`);
    console.log(`Successful: ${report.summary.successfulRequests}`);
    console.log(`Failed: ${report.summary.failedRequests}`);
    console.log(`Success Rate: ${report.summary.successRate}`);
    console.log(`Error Rate: ${report.summary.errorRate}`);
    
    console.log('\n⚡ PERFORMANCE:');
    console.log(`Average Response Time: ${report.performance.averageResponseTime}`);
    console.log(`Min Response Time: ${report.performance.minResponseTime}`);
    console.log(`Max Response Time: ${report.performance.maxResponseTime}`);
    console.log(`95th Percentile: ${report.performance.p95ResponseTime}`);
    console.log(`99th Percentile: ${report.performance.p99ResponseTime}`);
    
    if (report.errors.length > 0) {
      console.log('\n❌ ERRORS (first 10):');
      report.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.endpoint}: ${error.error}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
  }
}

// Test scenarios
async function runLoadTests() {
  const tester = new LoadTester();
  
  // Define test endpoints
  const endpoints = [
    '/',
    '/api/health',
    '/api/monitoring/health',
    '/dashboard',
    '/admin/dashboard',
    '/employee/dashboard',
    '/api/customers',
    '/api/employees',
    '/api/services',
    '/api/payments'
  ];

  console.log('🚀 Starting Load Tests...\n');

  // Test 1: Basic concurrent requests
  console.log('Test 1: Basic Concurrent Requests');
  await tester.runConcurrentRequests(endpoints, 20);
  
  // Test 2: Stress test on main page
  console.log('\nTest 2: Stress Test on Homepage');
  await tester.runStressTest('/', 30, 20);
  
  // Test 3: Spike test on API
  console.log('\nTest 3: Spike Test on Health API');
  await tester.runSpikeTest('/api/health', 5, 30, 45);
  
  // Test 4: Database-heavy operations
  console.log('\nTest 4: Database Operations');
  await tester.runConcurrentRequests([
    '/api/customers',
    '/api/employees', 
    '/api/services',
    '/api/payments'
  ], 15);

  // Generate and print report
  tester.printReport();
  
  // Save detailed results
  const fs = await import('fs');
  const report = tester.generateReport();
  fs.writeFileSync('load-test-results.json', JSON.stringify(report, null, 2));
  console.log('\n📄 Detailed results saved to load-test-results.json');
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runLoadTests().catch(console.error);
}

export { LoadTester, runLoadTests }; 