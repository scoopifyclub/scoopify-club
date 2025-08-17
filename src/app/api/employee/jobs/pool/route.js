import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserFromCookies } from '@/lib/api-auth';

export const runtime = 'nodejs';

export async function GET(request) {
  try {
    const user = await getAuthUserFromCookies(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the employee and their coverage areas
    const employee = await prisma.employee.findUnique({
      where: { userId: user.id },
      include: {
        serviceAreas: {
          where: { active: true },
          select: { zipCode: true, travelDistance: true }
        }
      }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Get ZIP codes the employee covers
    const coveredZips = employee.serviceAreas.map(area => area.zipCode);
    
    if (coveredZips.length === 0) {
      return NextResponse.json({ 
        jobs: [],
        message: 'No service areas configured. Please set up your coverage area first.'
      });
    }

    // Find available jobs in the employee's coverage area
    const availableJobs = await prisma.service.findMany({
      where: {
        status: {
          in: ['PENDING', 'SCHEDULED']
        },
        employeeId: null, // Not yet claimed
        customer: {
          address: {
            zipCode: {
              in: coveredZips
            }
          }
        }
      },
      include: {
        customer: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            },
            address: {
              select: {
                street: true,
                city: true,
                state: true,
                zipCode: true
              }
            }
          }
        },
        servicePlan: {
          select: {
            name: true,
            price: true
          }
        }
      },
      orderBy: [
        { scheduledDate: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    // Calculate potential earnings for each job
    const jobsWithEarnings = availableJobs.map(job => {
      // Use the potentialEarnings already calculated and stored in the service
      // This should be calculated as: (monthlyPayment / 4) * 0.75
      const potentialEarnings = job.potentialEarnings || 0;
      
      return {
        id: job.id,
        status: job.status,
        scheduledDate: job.scheduledDate,
        servicePlanId: job.servicePlanId,
        potentialEarnings,
        customer: job.customer,
        servicePlan: job.servicePlan,
        createdAt: job.createdAt
      };
    });

    return NextResponse.json({
      jobs: jobsWithEarnings,
      totalCount: jobsWithEarnings.length,
      employeeCoverage: {
        zipCodes: coveredZips,
        totalAreas: coveredZips.length
      }
    });

  } catch (error) {
    console.error('Error fetching available jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available jobs' },
      { status: 500 }
    );
  }
} 