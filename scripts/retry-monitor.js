// scripts/retry-monitor.js
// This script monitors payment retries in the database and provides statistics

const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config();
// Load environment variables from .env.local (overrides .env)
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function monitorRetries() {
  console.log('🔍 Monitoring payment retries');
  console.log('===========================');
  
  try {
    // Get total count of retry attempts
    const totalRetries = await prisma.paymentRetry.count();
    console.log(`Total retry attempts: ${totalRetries}`);
    
    // Get counts by status
    const statusCounts = await prisma.paymentRetry.groupBy({
      by: ['status'],
      _count: { id: true }
    });
    
    console.log('\nRetry status breakdown:');
    if (statusCounts.length === 0) {
      console.log('  No retry records found');
    } else {
      statusCounts.forEach(status => {
        console.log(`  ${status.status}: ${status._count.id}`);
      });
    }
    
    // Get the most recent retries
    const recentRetries = await prisma.paymentRetry.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        payment: {
          select: {
            amount: true,
            currency: true
          }
        }
      }
    });
    
    console.log('\nMost recent retry attempts:');
    if (recentRetries.length === 0) {
      console.log('  No retry records found');
    } else {
      recentRetries.forEach(retry => {
        const amount = retry.payment ? 
          `${(retry.payment.amount / 100).toFixed(2)} ${retry.payment.currency}` : 
          'unknown amount';
        
        console.log(`  ID: ${retry.id}`);
        console.log(`    Status: ${retry.status}`);
        console.log(`    Amount: ${amount}`);
        console.log(`    Created: ${retry.createdAt.toISOString()}`);
        console.log(`    Updated: ${retry.updatedAt.toISOString()}`);
        console.log(`    Attempts: ${retry.attemptCount}`);
        if (retry.metadata) {
          console.log(`    Metadata: ${JSON.stringify(retry.metadata)}`);
        }
        console.log('  ---');
      });
    }
    
    // Get success rate
    if (totalRetries > 0) {
      const successfulRetries = await prisma.paymentRetry.count({
        where: { status: 'succeeded' }
      });
      
      const successRate = ((successfulRetries / totalRetries) * 100).toFixed(2);
      console.log(`\nSuccess rate: ${successRate}%`);
    }
    
    // Get retry attempts distribution
    const attemptDistribution = await prisma.paymentRetry.groupBy({
      by: ['attemptCount'],
      _count: { id: true }
    });
    
    console.log('\nRetry attempt distribution:');
    if (attemptDistribution.length === 0) {
      console.log('  No retry records found');
    } else {
      attemptDistribution.forEach(item => {
        console.log(`  Attempt #${item.attemptCount}: ${item._count.id} records`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error during monitoring:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the monitor
monitorRetries(); 