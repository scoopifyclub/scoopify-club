import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Checking database contents...');
    
    const users = await prisma.user.findMany();
    console.log('Users found:', users.length);
    console.log('User emails:', users.map(u => u.email));
    
    const customers = await prisma.customer.findMany();
    console.log('\nCustomers found:', customers.length);
    
    const employees = await prisma.employee.findMany();
    console.log('\nEmployees found:', employees.length);
    
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 