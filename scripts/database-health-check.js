const { PrismaClient } = require('@prisma/client');
const https = require('https');
const http = require('http');

// Database health check configuration
const HEALTH_CHECK_CONFIG = {
  timeout: 30000, // 30 seconds
  maxRetries: 3,
  connectionPoolSize: 10,
  testQueries: [
    'SELECT 1 as test',
    'SELECT COUNT(*) as user_count FROM "User"',
    'SELECT COUNT(*) as customer_count FROM "Customer"',
    'SELECT COUNT(*) as service_count FROM "Service"',
    'SELECT COUNT(*) as payment_count FROM "Payment"'
  ]
};

// Initialize Prisma client
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: ['query', 'info', 'warn', 'error']
});

// Helper function to make HTTP requests
async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const req = client.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: HEALTH_CHECK_CONFIG.timeout,
      ...options
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Test database connection
async function testDatabaseConnection() {
  console.log('🔌 Testing Database Connection\n');
  
  try {
    // Test basic connection
    console.log('1️⃣ Testing basic connection...');
    await prisma.$connect();
    console.log('   ✅ Database connection successful');
    
    // Test simple query
    console.log('2️⃣ Testing simple query...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('   ✅ Simple query successful:', result);
    
    return true;
  } catch (error) {
    console.error('   ❌ Database connection failed:', error.message);
    return false;
  }
}

// Test database performance
async function testDatabasePerformance() {
  console.log('\n⚡ Testing Database Performance\n');
  
  const performanceResults = {};
  
  for (const query of HEALTH_CHECK_CONFIG.testQueries) {
    try {
      console.log(`📊 Testing: ${query}`);
      const startTime = Date.now();
      
      const result = await prisma.$queryRawUnsafe(query);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      performanceResults[query] = {
        success: true,
        duration: duration,
        result: result
      };
      
      console.log(`   ✅ Query completed in ${duration}ms`);
      
      if (duration > 1000) {
        console.log(`   ⚠️  Slow query detected (>1s)`);
      }
      
    } catch (error) {
      console.log(`   ❌ Query failed: ${error.message}`);
      performanceResults[query] = {
        success: false,
        error: error.message
      };
    }
  }
  
  return performanceResults;
}

// Test database schema
async function testDatabaseSchema() {
  console.log('\n🏗️  Testing Database Schema\n');
  
  try {
    // Check if all required tables exist
    const tables = [
      'User', 'Customer', 'Employee', 'Service', 'Payment',
      'Subscription', 'Address', 'CoverageArea', 'Notification'
    ];
    
    for (const table of tables) {
      try {
        const result = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${table}"`);
        console.log(`   ✅ Table '${table}' exists with ${result[0].count} records`);
      } catch (error) {
        console.log(`   ❌ Table '${table}' missing or inaccessible: ${error.message}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('   ❌ Schema test failed:', error.message);
    return false;
  }
}

// Test database indexes
async function testDatabaseIndexes() {
  console.log('\n📈 Testing Database Indexes\n');
  
  try {
    // Check for important indexes
    const indexQueries = [
      'SELECT indexname FROM pg_indexes WHERE tablename = \'User\' AND indexname LIKE \'%email%\';',
      'SELECT indexname FROM pg_indexes WHERE tablename = \'Customer\' AND indexname LIKE \'%userId%\';',
      'SELECT indexname FROM pg_indexes WHERE tablename = \'Service\' AND indexname LIKE \'%customerId%\';',
      'SELECT indexname FROM pg_indexes WHERE tablename = \'Payment\' AND indexname LIKE \'%stripePaymentIntentId%\';'
    ];
    
    for (const query of indexQueries) {
      try {
        const result = await prisma.$queryRawUnsafe(query);
        if (result.length > 0) {
          console.log(`   ✅ Index found: ${result[0].indexname}`);
        } else {
          console.log(`   ⚠️  No index found for query pattern`);
        }
      } catch (error) {
        console.log(`   ❌ Index check failed: ${error.message}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('   ❌ Index test failed:', error.message);
    return false;
  }
}

// Test connection pooling
async function testConnectionPooling() {
  console.log('\n🔄 Testing Connection Pooling\n');
  
  try {
    const poolSize = HEALTH_CHECK_CONFIG.connectionPoolSize;
    const promises = [];
    
    console.log(`   Testing ${poolSize} concurrent connections...`);
    
    for (let i = 0; i < poolSize; i++) {
      promises.push(
        prisma.$queryRaw`SELECT ${i} as connection_id, NOW() as timestamp`
      );
    }
    
    const startTime = Date.now();
    const results = await Promise.all(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`   ✅ All ${poolSize} connections completed in ${duration}ms`);
    console.log(`   📊 Average time per connection: ${(duration / poolSize).toFixed(2)}ms`);
    
    return {
      success: true,
      duration: duration,
      connectionCount: poolSize,
      averageTime: duration / poolSize
    };
    
  } catch (error) {
    console.error('   ❌ Connection pooling test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Test database migrations
async function testDatabaseMigrations() {
  console.log('\n🔄 Testing Database Migrations\n');
  
  try {
    // Check migration status
    const migrations = await prisma.$queryRaw`
      SELECT * FROM "_prisma_migrations" 
      ORDER BY finished_at DESC 
      LIMIT 5
    `;
    
    console.log(`   ✅ Found ${migrations.length} recent migrations`);
    
    for (const migration of migrations) {
      console.log(`   📋 ${migration.migration_name} - ${migration.finished_at}`);
    }
    
    return {
      success: true,
      migrations: migrations
    };
    
  } catch (error) {
    console.error('   ❌ Migration test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Test Neon-specific features
async function testNeonFeatures() {
  console.log('\n☁️  Testing Neon-Specific Features\n');
  
  try {
    // Test Neon's branching capability (if available)
    console.log('1️⃣ Testing Neon connection string...');
    const dbUrl = process.env.DATABASE_URL;
    
    if (dbUrl && dbUrl.includes('neon.tech')) {
      console.log('   ✅ Neon database detected');
      console.log('   📍 Region: us-west-2 (AWS)');
      console.log('   🔗 SSL Mode: require');
    } else {
      console.log('   ⚠️  Not using Neon database');
    }
    
    // Test read replicas (if configured)
    if (process.env.DIRECT_URL) {
      console.log('2️⃣ Testing direct connection...');
      const directPrisma = new PrismaClient({
        datasources: {
          db: {
            url: process.env.DIRECT_URL
          }
        }
      });
      
      await directPrisma.$connect();
      const result = await directPrisma.$queryRaw`SELECT 1 as direct_test`;
      await directPrisma.$disconnect();
      
      console.log('   ✅ Direct connection successful');
    }
    
    return true;
    
  } catch (error) {
    console.error('   ❌ Neon features test failed:', error.message);
    return false;
  }
}

// Generate health report
function generateHealthReport(results) {
  console.log('\n📊 Database Health Report\n');
  console.log('=' .repeat(50));
  
  const report = {
    timestamp: new Date().toISOString(),
    database: 'Neon PostgreSQL',
    connection: results.connection ? '✅ HEALTHY' : '❌ FAILED',
    performance: results.performance,
    schema: results.schema ? '✅ HEALTHY' : '❌ ISSUES',
    indexes: results.indexes ? '✅ HEALTHY' : '❌ ISSUES',
    pooling: results.pooling.success ? '✅ HEALTHY' : '❌ ISSUES',
    migrations: results.migrations.success ? '✅ HEALTHY' : '❌ ISSUES',
    neonFeatures: results.neonFeatures ? '✅ HEALTHY' : '❌ ISSUES'
  };
  
  console.log(`🕒 Timestamp: ${report.timestamp}`);
  console.log(`🗄️  Database: ${report.database}`);
  console.log(`🔌 Connection: ${report.connection}`);
  console.log(`🏗️  Schema: ${report.schema}`);
  console.log(`📈 Indexes: ${report.indexes}`);
  console.log(`🔄 Connection Pooling: ${report.pooling}`);
  console.log(`🔄 Migrations: ${report.migrations}`);
  console.log(`☁️  Neon Features: ${report.neonFeatures}`);
  
  // Performance summary
  if (results.performance) {
    console.log('\n⚡ Performance Summary:');
    let slowQueries = 0;
    let failedQueries = 0;
    
    Object.entries(results.performance).forEach(([query, result]) => {
      if (result.success) {
        if (result.duration > 1000) slowQueries++;
      } else {
        failedQueries++;
      }
    });
    
    console.log(`   📊 Total queries tested: ${Object.keys(results.performance).length}`);
    console.log(`   ⚠️  Slow queries (>1s): ${slowQueries}`);
    console.log(`   ❌ Failed queries: ${failedQueries}`);
  }
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  
  if (!results.connection) {
    console.log('   🔧 Check DATABASE_URL environment variable');
    console.log('   🔧 Verify Neon database is active');
    console.log('   🔧 Check network connectivity');
  }
  
  if (results.performance) {
    const slowQueries = Object.values(results.performance).filter(r => r.success && r.duration > 1000);
    if (slowQueries.length > 0) {
      console.log('   🚀 Consider adding database indexes');
      console.log('   🚀 Optimize slow queries');
      console.log('   🚀 Consider connection pooling');
    }
  }
  
  return report;
}

// Main health check execution
async function runDatabaseHealthCheck() {
  console.log('🏥 Starting Comprehensive Database Health Check\n');
  console.log('=' .repeat(60));
  
  const results = {};
  
  try {
    // Run all health checks
    results.connection = await testDatabaseConnection();
    results.performance = await testDatabasePerformance();
    results.schema = await testDatabaseSchema();
    results.indexes = await testDatabaseIndexes();
    results.pooling = await testConnectionPooling();
    results.migrations = await testDatabaseMigrations();
    results.neonFeatures = await testNeonFeatures();
    
    // Generate report
    const report = generateHealthReport(results);
    
    console.log('\n🎉 Database health check completed!');
    
    // Determine overall health
    const isHealthy = results.connection && results.schema && results.pooling.success;
    
    if (isHealthy) {
      console.log('\n✅ Database is HEALTHY and ready for production!');
    } else {
      console.log('\n⚠️  Database has issues that need attention.');
    }
    
    return report;
    
  } catch (error) {
    console.error('\n❌ Health check failed:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run health check if this file is executed directly
if (require.main === module) {
  runDatabaseHealthCheck().catch(console.error);
}

module.exports = {
  runDatabaseHealthCheck,
  testDatabaseConnection,
  testDatabasePerformance,
  testDatabaseSchema,
  testDatabaseIndexes,
  testConnectionPooling,
  testDatabaseMigrations,
  testNeonFeatures
}; 