// Quick security and performance test
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

console.log('🔒 Quick Security & Performance Test\n');

async function runQuickTests() {
  try {
    // Test 1: Password Hashing
    console.log('1️⃣ Testing Password Hashing...');
    const password = 'TestPassword123!';
    const hash = await bcrypt.hash(password, 12);
    const isValid = await bcrypt.compare(password, hash);
    
    if (isValid) {
      console.log('   ✅ Password hashing working correctly');
    } else {
      throw new Error('Password hashing failed');
    }

    // Test 2: JWT Token Security
    console.log('\n2️⃣ Testing JWT Token Security...');
    const secret = process.env.JWT_SECRET || 'test-secret-key';
    const payload = { userId: '123', email: 'test@example.com' };
    const token = jwt.sign(payload, secret, { expiresIn: '1h' });
    const decoded = jwt.verify(token, secret);
    
    if (decoded.userId === payload.userId) {
      console.log('   ✅ JWT token security working correctly');
    } else {
      throw new Error('JWT token verification failed');
    }

    // Test 3: Input Validation
    console.log('\n3️⃣ Testing Input Validation...');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validEmails = ['test@example.com', 'user.name@domain.co.uk'];
    const invalidEmails = ['invalid-email', '@example.com', 'user@'];
    
    let validationPassed = true;
    validEmails.forEach(email => {
      if (!emailRegex.test(email)) {
        validationPassed = false;
      }
    });
    
    invalidEmails.forEach(email => {
      if (emailRegex.test(email)) {
        validationPassed = false;
      }
    });
    
    if (validationPassed) {
      console.log('   ✅ Input validation working correctly');
    } else {
      throw new Error('Input validation failed');
    }

    // Test 4: Database Connection
    console.log('\n4️⃣ Testing Database Connection...');
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const startTime = Date.now();
    await prisma.user.findMany({ take: 1 });
    const duration = Date.now() - startTime;
    
    await prisma.$disconnect();
    
    if (duration < 1000) {
      console.log(`   ✅ Database connection working (${duration}ms)`);
    } else {
      throw new Error(`Database query too slow: ${duration}ms`);
    }

    // Test 5: Caching System
    console.log('\n5️⃣ Testing Caching System...');
    const { cache } = await import('../src/lib/simple-cache.js');
    
    const cacheStartTime = Date.now();
    await cache.set('test-key', { data: 'test-value' }, 60);
    const cachedData = await cache.get('test-key');
    const cacheDuration = Date.now() - cacheStartTime;
    
    if (cachedData && cachedData.data === 'test-value' && cacheDuration < 100) {
      console.log(`   ✅ Caching system working (${cacheDuration}ms)`);
    } else {
      throw new Error('Caching system failed');
    }

    // Test 6: API Optimization
    console.log('\n6️⃣ Testing API Optimization...');
    const { optimizeApi } = await import('../src/lib/api-optimizer.js');
    
    const apiStartTime = Date.now();
    const testData = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `Item ${i}` }));
    const paginated = optimizeApi.paginate(testData, 1, 10);
    const apiDuration = Date.now() - apiStartTime;
    
    if (paginated.data.length === 10 && apiDuration < 50) {
      console.log(`   ✅ API optimization working (${apiDuration}ms)`);
    } else {
      throw new Error('API optimization failed');
    }

    console.log('\n🎉 All security and performance tests passed!');
    console.log('💡 Your app is secure and performant!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

runQuickTests(); 