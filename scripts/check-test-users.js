import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkAndCreateTestUsers() {
  try {
    console.log('🔍 Checking for test users...');

    // Check if test@example.com exists
    const existingTestUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    });

    if (!existingTestUser) {
      console.log('📝 Creating test user: test@example.com');
      
      const hashedPassword = await bcrypt.hash('Test123!@#', 12);
      
      const testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: hashedPassword,
          name: 'Test User',
          role: 'CUSTOMER',
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      console.log('✅ Test user created:', testUser.email);
    } else {
      console.log('✅ Test user already exists:', existingTestUser.email);
    }

    // Check if admin@example.com exists
    const existingAdminUser = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    });

    if (!existingAdminUser) {
      console.log('📝 Creating admin user: admin@example.com');
      
      const hashedPassword = await bcrypt.hash('Admin123!@#', 12);
      
      const adminUser = await prisma.user.create({
        data: {
          email: 'admin@example.com',
          password: hashedPassword,
          name: 'Admin User',
          role: 'ADMIN',
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      console.log('✅ Admin user created:', adminUser.email);
    } else {
      console.log('✅ Admin user already exists:', existingAdminUser.email);
    }

    // Check if employee@example.com exists
    const existingEmployeeUser = await prisma.user.findUnique({
      where: { email: 'employee@example.com' }
    });

    if (!existingEmployeeUser) {
      console.log('📝 Creating employee user: employee@example.com');
      
      const hashedPassword = await bcrypt.hash('Employee123!@#', 12);
      
      const employeeUser = await prisma.user.create({
        data: {
          email: 'employee@example.com',
          password: hashedPassword,
          name: 'Employee User',
          role: 'EMPLOYEE',
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      console.log('✅ Employee user created:', employeeUser.email);
    } else {
      console.log('✅ Employee user already exists:', existingEmployeeUser.email);
    }

    console.log('🎉 Test users check completed!');
    
    // List all users for verification
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true
      }
    });
    
    console.log('\n📋 All users in database:');
    allUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.role}) - Verified: ${user.emailVerified}`);
    });

  } catch (error) {
    console.error('❌ Error checking/creating test users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndCreateTestUsers(); 