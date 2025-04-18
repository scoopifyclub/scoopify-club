import cron from 'node-cron';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Schedule the job to run every Sunday at 12:00 AM
cron.schedule('0 0 * * 0', async () => {
  try {
    console.log('Running weekly job scheduling...');
    const { stdout, stderr } = await execAsync('npm run schedule-jobs');
    
    if (stderr) {
      console.error('Error scheduling jobs:', stderr);
    } else {
      console.log('Jobs scheduled successfully:', stdout);
    }
  } catch (error) {
    console.error('Error in cron job:', error);
  }
});

console.log('Cron job scheduler started. Will run every Sunday at 12:00 AM.'); 