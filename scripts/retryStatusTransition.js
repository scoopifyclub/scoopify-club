// scripts/retryStatusTransition.js
// Track status transitions of payment retries over time

const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeStatusTransitions() {
  console.log('📊 Analyzing Payment Retry Status Transitions');
  console.log('==========================================');
  
  try {
    // Get retries with their status history from metadata
    const retries = await prisma.paymentRetry.findMany({
      where: {
        metadata: {
          path: ['statusHistory'],
          not: null
        }
      },
      select: {
        id: true,
        status: true,
        metadata: true,
        attemptCount: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (retries.length === 0) {
      console.log('No retries with status history found');
      return;
    }
    
    console.log(`Found ${retries.length} retries with status history`);
    
    // Collect transition statistics
    const transitions = {};
    const totalDurations = {};
    const transitionCounts = {};
    
    retries.forEach(retry => {
      const history = retry.metadata?.statusHistory || [];
      
      // Skip if no meaningful history
      if (history.length <= 1) return;
      
      for (let i = 0; i < history.length - 1; i++) {
        const fromStatus = history[i].status;
        const toStatus = history[i + 1].status;
        const transitionKey = `${fromStatus} → ${toStatus}`;
        
        // Count transitions
        transitions[transitionKey] = (transitions[transitionKey] || 0) + 1;
        
        // Calculate duration if timestamps available
        if (history[i].timestamp && history[i + 1].timestamp) {
          const startTime = new Date(history[i].timestamp);
          const endTime = new Date(history[i + 1].timestamp);
          const duration = (endTime - startTime) / 1000; // in seconds
          
          if (!totalDurations[transitionKey]) {
            totalDurations[transitionKey] = 0;
            transitionCounts[transitionKey] = 0;
          }
          
          totalDurations[transitionKey] += duration;
          transitionCounts[transitionKey]++;
        }
      }
    });
    
    // Display transition stats
    console.log('\nStatus Transition Counts:');
    Object.keys(transitions).sort().forEach(transition => {
      console.log(`  ${transition}: ${transitions[transition]} times`);
    });
    
    // Display average durations
    console.log('\nAverage Transition Durations:');
    Object.keys(totalDurations).sort().forEach(transition => {
      const avg = totalDurations[transition] / transitionCounts[transition];
      // Format based on duration
      let formattedTime;
      if (avg < 60) {
        formattedTime = `${avg.toFixed(1)} seconds`;
      } else if (avg < 3600) {
        formattedTime = `${(avg / 60).toFixed(1)} minutes`;
      } else {
        formattedTime = `${(avg / 3600).toFixed(1)} hours`;
      }
      console.log(`  ${transition}: ${formattedTime}`);
    });
    
    // Analyze success paths
    console.log('\nCommon Paths to Success:');
    const successPaths = {};
    
    retries.forEach(retry => {
      if (retry.status === 'succeeded') {
        const history = retry.metadata?.statusHistory || [];
        if (history.length > 0) {
          const pathKey = history.map(h => h.status).join(' → ');
          successPaths[pathKey] = (successPaths[pathKey] || 0) + 1;
        }
      }
    });
    
    // Sort by frequency and display
    const sortedPaths = Object.entries(successPaths)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);  // Top 5 paths
      
    if (sortedPaths.length > 0) {
      sortedPaths.forEach(([path, count]) => {
        console.log(`  ${path}: ${count} times`);
      });
    } else {
      console.log('  No successful paths found');
    }
    
    // Calculate average attempts before success
    const successfulRetries = retries.filter(r => r.status === 'succeeded');
    if (successfulRetries.length > 0) {
      const totalAttempts = successfulRetries.reduce((sum, r) => sum + r.attemptCount, 0);
      const avgAttempts = totalAttempts / successfulRetries.length;
      console.log(`\nAverage attempts before success: ${avgAttempts.toFixed(1)}`);
    }
    
  } catch (error) {
    console.error('❌ Error analyzing status transitions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the analysis
analyzeStatusTransitions(); 