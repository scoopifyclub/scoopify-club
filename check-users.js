import prisma from './src/lib/prisma.js';

async function checkUsers() {
  try {
    console.log('=== Checking User Data ===\n');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('All users in database:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. Name: "${user.name}"`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   ID: ${user.id.substring(0, 8)}...`);
      console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
      console.log('');
    });
    
    console.log('=== Employee Records ===\n');
    const employees = await prisma.employee.findMany({
      include: {
        user: {
          select: { email: true, name: true }
        }
      }
    });
    
    employees.forEach((emp, index) => {
      console.log(`${index + 1}. Employee Name: "${emp.user.name}"`);
      console.log(`   Email: ${emp.user.email}`);
      console.log(`   Status: ${emp.status}`);
      console.log(`   Phone: ${emp.phone || 'Not set'}`);
      console.log(`   Employee ID: ${emp.id.substring(0, 8)}...`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers(); 