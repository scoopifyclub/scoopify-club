#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabaseStatus() {
  try {
    console.log('🔍 Checking database status...\n');

    // Check main tables and their record counts
    console.log('📊 Main Table Record Counts:');
    console.log('='.repeat(50));

    // Check Users
    const userCount = await prisma.user.count();
    console.log(`Users                           | ${userCount.toString().padStart(8)} records`);

    // Check Customers
    const customerCount = await prisma.customer.count();
    console.log(`Customers                       | ${customerCount.toString().padStart(8)} records`);

    // Check Employees
    const employeeCount = await prisma.employee.count();
    console.log(`Employees                       | ${employeeCount.toString().padStart(8)} records`);

    // Check Services
    const serviceCount = await prisma.service.count();
    console.log(`Services                        | ${serviceCount.toString().padStart(8)} records`);

    // Check ServicePlans
    const servicePlanCount = await prisma.servicePlan.count();
    console.log(`ServicePlans                    | ${servicePlanCount.toString().padStart(8)} records`);

    // Check CoverageAreas
    const coverageAreaCount = await prisma.coverageArea.count();
    console.log(`CoverageAreas                   | ${coverageAreaCount.toString().padStart(8)} records`);

    // Check Addresses
    const addressCount = await prisma.address.count();
    console.log(`Addresses                       | ${addressCount.toString().padStart(8)} records`);

    // Check Payments
    const paymentCount = await prisma.payment.count();
    console.log(`Payments                        | ${paymentCount.toString().padStart(8)} records`);

    // Check Payouts
    const payoutCount = await prisma.payout.count();
    console.log(`Payouts                         | ${payoutCount.toString().padStart(8)} records`);

    // Check Notifications
    const notificationCount = await prisma.notification.count();
    console.log(`Notifications                   | ${notificationCount.toString().padStart(8)} records`);

    // Check Subscriptions
    const subscriptionCount = await prisma.subscription.count();
    console.log(`Subscriptions                   | ${subscriptionCount.toString().padStart(8)} records`);

    // Check Referrals
    const referralCount = await prisma.referral.count();
    console.log(`Referrals                       | ${referralCount.toString().padStart(8)} records`);

    // Check Earnings
    const earningCount = await prisma.earning.count();
    console.log(`Earnings                        | ${earningCount.toString().padStart(8)} records`);

    // Check Locations
    const locationCount = await prisma.location.count();
    console.log(`Locations                       | ${locationCount.toString().padStart(8)} records`);

    console.log('\n🔍 Checking for potential issues...\n');

    // Check for test data
    console.log('Checking for test data:');
    
    const testUsers = await prisma.user.count({
      where: {
        OR: [
          { email: { contains: 'test' } },
          { email: { contains: 'example' } },
          { name: { contains: 'Test' } },
          { name: { contains: 'test' } }
        ]
      }
    });
    console.log(`Users with 'test' in email/name: ${testUsers}`);

    const testServices = await prisma.service.count({
      where: {
        OR: [
          { notes: { contains: 'test' } },
          { notes: { contains: 'Test' } }
        ]
      }
    });
    console.log(`Services with 'test' in notes: ${testServices}`);

    // Check for duplicate users by email
    console.log('\nChecking for duplicate data:');
    
    const users = await prisma.user.findMany({
      select: { email: true }
    });
    
    const emailCounts = {};
    users.forEach(user => {
      emailCounts[user.email] = (emailCounts[user.email] || 0) + 1;
    });
    
    const duplicateEmails = Object.entries(emailCounts).filter(([email, count]) => count > 1);
    console.log(`Duplicate users by email: ${duplicateEmails.length}`);

    // Check database size (approximate)
    console.log('\n📈 Database Size Estimation:');
    
    const totalRecords = userCount + customerCount + employeeCount + serviceCount + 
                        servicePlanCount + coverageAreaCount + addressCount + paymentCount + 
                        payoutCount + notificationCount + subscriptionCount + referralCount + 
                        earningCount + locationCount;
    
    console.log(`Total records across main tables: ${totalRecords}`);
    
    if (totalRecords > 10000) {
      console.log('⚠️  WARNING: Database has a large number of records - consider cleanup');
    } else if (totalRecords > 1000) {
      console.log('⚠️  NOTICE: Database has moderate number of records');
    } else {
      console.log('✅ Database size looks reasonable');
    }

    // Check for recent activity
    console.log('\n📅 Recent Activity:');
    
    const recentServices = await prisma.service.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    });
    console.log(`Services created in last 7 days: ${recentServices}`);

    const recentUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    });
    console.log(`Users created in last 7 days: ${recentUsers}`);

  } catch (error) {
    console.error('❌ Error checking database status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseStatus(); 