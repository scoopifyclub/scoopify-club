require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testAuthSetup() {
  try {
    // Test 1: Create a test user
    const hashedPassword = await bcrypt.hash('testpassword123', 10);
    const testUser = await prisma.user.upsert({
      where: { email: 'test@scoopifyclub.com' },
      update: {},
      create: {
        email: 'test@scoopifyclub.com',
        name: 'Test User',
        password: hashedPassword,
        role: 'CUSTOMER'
      }
    });

    console.log('✅ Test user created successfully:', testUser.email);

    // Test 2: Verify password hashing
    const isPasswordValid = await bcrypt.compare('testpassword123', testUser.password);
    if (isPasswordValid) {
      console.log('✅ Password hashing works correctly');
    } else {
      console.error('❌ Password hashing verification failed');
    }

    // Test 3: Check user roles
    const userWithRole = await prisma.user.findUnique({
      where: { email: testUser.email },
      select: { role: true }
    });

    if (userWithRole?.role === 'CUSTOMER') {
      console.log('✅ User role system working correctly');
    } else {
      console.error('❌ User role verification failed');
    }

    return true;
  } catch (error) {
    console.error('❌ Auth setup test failed:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testAuthSetup(); 