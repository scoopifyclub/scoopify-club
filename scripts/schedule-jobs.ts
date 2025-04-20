import prisma from "@/lib/prisma";
import { sign } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

async function scheduleJobs() {
  try {
    // Get admin user to generate token
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!admin) {
      console.error('No admin user found');
      return;
    }

    // Generate admin token
    const token = sign(
      { userId: admin.id, role: 'ADMIN' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Call the scheduling endpoint
    const response = await fetch('http://localhost:3000/api/admin/jobs/schedule', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to schedule jobs: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Jobs scheduled successfully:', result);
  } catch (error) {
    console.error('Error in schedule-jobs script:', error);
  }
}

// Run the script
scheduleJobs(); 