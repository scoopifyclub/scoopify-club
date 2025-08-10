import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addDays, startOfWeek, endOfWeek } from 'date-fns';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';


// This endpoint should be called by a cron job (e.g., Vercel Cron)
// Recommended schedule: Every Monday at 8:00 AM
export async function POST(request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = {
      coverageAnalysis: {},
      jobPostingsCreated: 0,
      applicationsProcessed: 0,
      interviewsScheduled: 0,
      onboardingInitiated: 0,
      errors: []
    };

    // 1. Analyze coverage gaps and recruitment needs
    const coverageAnalysis = await analyzeCoverageGaps();
    results.coverageAnalysis = coverageAnalysis;

    // 2. Create automated job postings for high-priority areas
    if (coverageAnalysis.highPriorityAreas.length > 0) {
      const jobPostings = await createAutomatedJobPostings(coverageAnalysis.highPriorityAreas);
      results.jobPostingsCreated = jobPostings.length;
    }

    // 3. Process pending applications
    const applicationsProcessed = await processPendingApplications();
    results.applicationsProcessed = applicationsProcessed;

    // 4. Schedule automated interviews
    const interviewsScheduled = await scheduleAutomatedInterviews();
    results.interviewsScheduled = interviewsScheduled;

    // 5. Initiate onboarding for approved candidates
    const onboardingInitiated = await initiateAutomatedOnboarding();
    results.onboardingInitiated = onboardingInitiated;

    console.log('Automated recruitment summary:', results);

    return NextResponse.json({
      success: true,
      results: results
    });

  } catch (error) {
    console.error('Error in automated employee recruitment:', error);
    return NextResponse.json(
      { error: 'Failed to process automated recruitment' },
      { status: 500 }
    );
  }
}

async function analyzeCoverageGaps() {
  try {
    // Get all active customers and their zip codes
    const customerZips = await prisma.customer.findMany({
      where: { status: 'ACTIVE' },
      select: { zipCode: true },
      distinct: ['zipCode']
    });

    // Get all covered zip codes
    const coveredZips = await prisma.coverageArea.findMany({
      where: { active: true },
      select: { zipCode: true },
      distinct: ['zipCode']
    });

    const customerZipSet = new Set(customerZips.map(c => c.zipCode));
    const coveredZipSet = new Set(coveredZips.map(c => c.zipCode));

    // Find gaps
    const uncoveredZips = Array.from(customerZipSet).filter(zip => !coveredZipSet.has(zip));

    // Analyze service demand in uncovered areas
    const highPriorityAreas = [];
    for (const zip of uncoveredZips) {
      const customerCount = await prisma.customer.count({
        where: { zipCode: zip, status: 'ACTIVE' }
      });

      if (customerCount >= 3) { // High priority if 3+ customers
        highPriorityAreas.push({
          zipCode: zip,
          customerCount,
          priority: 'HIGH'
        });
      } else if (customerCount >= 1) { // Medium priority if 1-2 customers
        highPriorityAreas.push({
          zipCode: zip,
          customerCount,
          priority: 'MEDIUM'
        });
      }
    }

    return {
      totalCustomerZips: customerZipSet.size,
      totalCoveredZips: coveredZipSet.size,
      uncoveredZips: uncoveredZips.length,
      highPriorityAreas: highPriorityAreas.sort((a, b) => b.customerCount - a.customerCount)
    };

  } catch (error) {
    console.error('Error analyzing coverage gaps:', error);
    return {
      totalCustomerZips: 0,
      totalCoveredZips: 0,
      uncoveredZips: 0,
      highPriorityAreas: []
    };
  }
}

async function createAutomatedJobPostings(highPriorityAreas) {
  const createdPostings = [];

  for (const area of highPriorityAreas.slice(0, 5)) { // Limit to top 5 areas
    try {
      // Check if we already have a recent job posting for this area
      const existingPosting = await prisma.jobPosting.findFirst({
        where: {
          zipCode: area.zipCode,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      });

      if (existingPosting) {
        continue; // Skip if recent posting exists
      }

      // Create automated job posting
      const jobPosting = await prisma.jobPosting.create({
        data: {
          title: `Dog Waste Removal Specialist - ${area.zipCode}`,
          description: generateJobDescription(area),
          zipCode: area.zipCode,
          salary: '$18-25/hour',
          type: 'PART_TIME',
          status: 'ACTIVE',
          priority: area.priority,
          customerCount: area.customerCount,
          autoGenerated: true
        }
      });

      createdPostings.push(jobPosting);

      // Post to external job boards (simulated)
      await postToJobBoards(jobPosting);

    } catch (error) {
      console.error(`Error creating job posting for ${area.zipCode}:`, error);
    }
  }

  return createdPostings;
}

function generateJobDescription(area) {
  return `Join ScoopifyClub as a Dog Waste Removal Specialist in ${area.zipCode}!

We're looking for reliable, detail-oriented individuals to join our growing team. This is a perfect opportunity for students, part-time workers, or anyone looking for flexible hours.

What you'll do:
• Remove dog waste from residential yards
• Work flexible hours (mornings/evenings)
• Use our app to track jobs and earnings
• Earn $18-25/hour based on experience

Requirements:
• Reliable transportation
• Smartphone with GPS
• Ability to work outdoors
• Attention to detail
• Professional appearance

Benefits:
• Flexible scheduling
• Weekly payouts
• Performance bonuses
• Training provided
• Growth opportunities

Currently serving ${area.customerCount} customers in your area with more joining weekly!

Apply now to join our team!`;
}

async function postToJobBoards(jobPosting) {
  try {
    // Simulate posting to external job boards
    const jobBoards = ['Indeed', 'Craigslist', 'ZipRecruiter', 'Local Facebook Groups'];
    
    for (const board of jobBoards) {
      console.log(`Posting job to ${board}: ${jobPosting.title}`);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In production, this would integrate with actual job board APIs
      // await indeedAPI.createJob(jobPosting);
      // await craigslistAPI.postJob(jobPosting);
    }

    // Update posting status
    await prisma.jobPosting.update({
      where: { id: jobPosting.id },
      data: { 
        postedToBoards: jobBoards,
        lastPostedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Error posting to job boards:', error);
  }
}

async function processPendingApplications() {
  try {
    // Get pending applications from the last 7 days
    const pendingApplications = await prisma.jobApplication.findMany({
      where: {
        status: 'PENDING',
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        jobPosting: true
      }
    });

    let processed = 0;

    for (const application of pendingApplications) {
      try {
        // Automated screening based on criteria
        const screeningResult = await screenApplication(application);
        
        if (screeningResult.approved) {
          await prisma.jobApplication.update({
            where: { id: application.id },
            data: { 
              status: 'SCREENED',
              screeningNotes: screeningResult.notes
            }
          });

          // Send automated response
          await sendApplicationResponse(application, 'approved');
          processed++;
        } else {
          await prisma.jobApplication.update({
            where: { id: application.id },
            data: { 
              status: 'REJECTED',
              screeningNotes: screeningResult.notes
            }
          });

          await sendApplicationResponse(application, 'rejected');
          processed++;
        }

      } catch (error) {
        console.error(`Error processing application ${application.id}:`, error);
      }
    }

    return processed;

  } catch (error) {
    console.error('Error processing pending applications:', error);
    return 0;
  }
}

async function screenApplication(application) {
  // Basic automated screening criteria
  const criteria = {
    hasPhone: !!application.phone,
    hasEmail: !!application.email,
    hasExperience: application.experience && application.experience.length > 10,
    hasTransportation: application.hasTransportation,
    isLocal: application.isLocalToArea
  };

  const passedCriteria = Object.values(criteria).filter(Boolean).length;
  const totalCriteria = Object.keys(criteria).length;
  const passRate = passedCriteria / totalCriteria;

  const approved = passRate >= 0.8; // 80% pass rate required

  return {
    approved,
    notes: `Screening results: ${passedCriteria}/${totalCriteria} criteria met (${Math.round(passRate * 100)}%)`
  };
}

async function scheduleAutomatedInterviews() {
  try {
    // Get screened applications that need interviews
    const screenedApplications = await prisma.jobApplication.findMany({
      where: {
        status: 'SCREENED',
        interviewScheduled: false
      },
      include: {
        jobPosting: true
      }
    });

    let scheduled = 0;

    for (const application of screenedApplications.slice(0, 10)) { // Limit to 10 per run
      try {
        // Schedule automated video interview
        const interview = await prisma.interview.create({
          data: {
            applicationId: application.id,
            type: 'VIDEO',
            scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
            duration: 30, // 30 minutes
            status: 'SCHEDULED',
            autoScheduled: true
          }
        });

        // Update application
        await prisma.jobApplication.update({
          where: { id: application.id },
          data: { 
            interviewScheduled: true,
            interviewId: interview.id
          }
        });

        // Send interview invitation
        await sendInterviewInvitation(application, interview);
        scheduled++;

      } catch (error) {
        console.error(`Error scheduling interview for application ${application.id}:`, error);
      }
    }

    return scheduled;

  } catch (error) {
    console.error('Error scheduling automated interviews:', error);
    return 0;
  }
}

async function initiateAutomatedOnboarding() {
  try {
    // Get approved applications that need onboarding
    const approvedApplications = await prisma.jobApplication.findMany({
      where: {
        status: 'APPROVED',
        onboardingInitiated: false
      }
    });

    let initiated = 0;

    for (const application of approvedApplications.slice(0, 5)) { // Limit to 5 per run
      try {
        // Create employee account
        const employee = await createEmployeeFromApplication(application);

        // Initiate onboarding workflow
        await prisma.onboardingWorkflow.create({
          data: {
            employeeId: employee.id,
            status: 'INITIATED',
            steps: [
              { step: 'BACKGROUND_CHECK', status: 'PENDING' },
              { step: 'DOCUMENT_UPLOAD', status: 'PENDING' },
              { step: 'TRAINING_COMPLETION', status: 'PENDING' },
              { step: 'EQUIPMENT_SETUP', status: 'PENDING' }
            ]
          }
        });

        // Update application
        await prisma.jobApplication.update({
          where: { id: application.id },
          data: { 
            onboardingInitiated: true,
            employeeId: employee.id
          }
        });

        // Send onboarding welcome email
        await sendOnboardingWelcome(application, employee);
        initiated++;

      } catch (error) {
        console.error(`Error initiating onboarding for application ${application.id}:`, error);
      }
    }

    return initiated;

  } catch (error) {
    console.error('Error initiating automated onboarding:', error);
    return 0;
  }
}

async function createEmployeeFromApplication(application) {
  // Create user account
  const user = await prisma.user.create({
    data: {
      email: application.email,
      name: application.name,
      role: 'EMPLOYEE',
      password: 'temporary_password', // Will be changed on first login
      emailVerified: true
    }
  });

  // Create employee record
  const employee = await prisma.employee.create({
    data: {
      userId: user.id,
      status: 'PENDING_ONBOARDING',
      phone: application.phone,
      hireDate: new Date(),
      source: 'AUTOMATED_RECRUITMENT'
    }
  });

  return employee;
}

async function sendApplicationResponse(application, status) {
  try {
    const subject = status === 'approved' 
      ? 'Application Approved - Next Steps' 
      : 'Application Status Update';

    const message = status === 'approved'
      ? `Hi ${application.name}, congratulations! Your application has been approved. We'll be in touch soon to schedule an interview.`
      : `Hi ${application.name}, thank you for your interest in ScoopifyClub. We've reviewed your application and will keep your information on file for future opportunities.`;

    // Send email notification
    await sendEmailNotification({
      to: application.email,
      subject,
      template: `application-${status}`,
      data: {
        applicantName: application.name,
        position: application.jobPosting?.title || 'Dog Waste Removal Specialist'
      }
    });

  } catch (error) {
    console.error('Error sending application response:', error);
  }
}

async function sendInterviewInvitation(application, interview) {
  try {
    await sendEmailNotification({
      to: application.email,
      subject: 'Interview Invitation - ScoopifyClub',
      template: 'interview-invitation',
      data: {
        applicantName: application.name,
        interviewDate: interview.scheduledAt.toLocaleDateString(),
        interviewTime: interview.scheduledAt.toLocaleTimeString(),
        duration: interview.duration
      }
    });

  } catch (error) {
    console.error('Error sending interview invitation:', error);
  }
}

async function sendOnboardingWelcome(application, employee) {
  try {
    await sendEmailNotification({
      to: application.email,
      subject: 'Welcome to ScoopifyClub - Onboarding Started',
      template: 'onboarding-welcome',
      data: {
        employeeName: application.name,
        employeeId: employee.id,
        onboardingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/employee/onboarding/${employee.id}`
      }
    });

  } catch (error) {
    console.error('Error sending onboarding welcome:', error);
  }
}

async function sendEmailNotification({ to, subject, template, data }) {
  try {
    // This would integrate with your email service
    console.log(`Sending ${template} email to ${to}`);
    console.log('Email data:', { subject, template, data });
    
  } catch (error) {
    console.error('Error sending email notification:', error);
    throw error;
  }
} 