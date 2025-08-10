import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/api-auth';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';


export async function GET(request) {
  const { userId } = getUserFromToken(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'service-areas'; // service-areas, route, jobs

    // Get employee
    const employee = await prisma.employee.findUnique({
      where: { userId },
      include: {
        serviceAreas: {
          where: { active: true }
        },
        services: {
          where: {
            scheduledDate: {
              gte: new Date()
            }
          },
          include: {
            customer: {
              include: {
                address: true
              }
            }
          },
          orderBy: {
            scheduledDate: 'asc'
          }
        }
      }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    switch (type) {
      case 'service-areas':
        return await getServiceAreasData(employee);
      case 'route':
        return await getRouteData(employee);
      case 'jobs':
        return await getJobsData(employee);
      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error fetching map data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch map data' },
      { status: 500 }
    );
  }
}

async function getServiceAreasData(employee) {
  // Get service areas with coverage data
  const serviceAreas = employee.serviceAreas.map(area => ({
    id: area.id,
    zipCode: area.zipCode,
    travelDistance: area.travelDistance,
    active: area.active,
    // Mock coordinates for demo - in real app, you'd geocode the zip codes
    coordinates: {
      lat: 39.7392 + (Math.random() - 0.5) * 0.1, // Denver area
      lng: -104.9903 + (Math.random() - 0.5) * 0.1
    }
  }));

  return NextResponse.json({
    type: 'service-areas',
    data: {
      serviceAreas,
      center: {
        lat: 39.7392,
        lng: -104.9903
      },
      zoom: 10
    }
  });
}

async function getRouteData(employee) {
  // Get today's services for route optimization
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todaysServices = employee.services.filter(service => {
    const serviceDate = new Date(service.scheduledDate);
    return serviceDate >= today && serviceDate < tomorrow;
  });

  // Create route waypoints
  const waypoints = todaysServices.map((service, index) => ({
    id: service.id,
    position: index + 1,
    customerName: service.customer.User?.name || 'Unknown Customer',
    address: service.customer.address ? {
      street: service.customer.address.street,
      city: service.customer.address.city,
      state: service.customer.address.state,
      zipCode: service.customer.address.zipCode
    } : null,
    scheduledTime: service.scheduledDate,
    estimatedDuration: 30, // minutes
    // Mock coordinates for demo
    coordinates: {
      lat: 39.7392 + (Math.random() - 0.5) * 0.2,
      lng: -104.9903 + (Math.random() - 0.5) * 0.2
    }
  }));

  // Calculate route statistics
  const totalDistance = waypoints.length * 5; // Mock distance calculation
  const totalDuration = waypoints.length * 30; // 30 minutes per service
  const totalEarnings = waypoints.reduce((sum, waypoint) => {
    return sum + (waypoint.potentialEarnings || 0);
  }, 0);

  return NextResponse.json({
    type: 'route',
    data: {
      waypoints,
      statistics: {
        totalStops: waypoints.length,
        totalDistance: `${totalDistance} miles`,
        totalDuration: `${totalDuration} minutes`,
        totalEarnings: `$${totalEarnings.toFixed(2)}`
      },
      center: {
        lat: 39.7392,
        lng: -104.9903
      },
      zoom: 11
    }
  });
}

async function getJobsData(employee) {
  // Get available jobs in employee's service areas
  const employeeZipCodes = employee.serviceAreas.map(area => area.zipCode);

  const availableJobs = await prisma.service.findMany({
    where: {
      status: 'SCHEDULED',
      employeeId: null,
      customer: {
        address: {
          zipCode: {
            in: employeeZipCodes
          }
        }
      }
    },
    include: {
      customer: {
        include: {
          User: {
            select: {
              name: true
            }
          },
          address: true
        }
      }
    },
    orderBy: {
      scheduledDate: 'asc'
    }
  });

  const jobsData = availableJobs.map(job => ({
    id: job.id,
    customerName: job.customer.User?.name || 'Unknown Customer',
    address: job.customer.address ? {
      street: job.customer.address.street,
      city: job.customer.address.city,
      state: job.customer.address.state,
      zipCode: job.customer.address.zipCode
    } : null,
    scheduledDate: job.scheduledDate,
    potentialEarnings: job.potentialEarnings || 0,
    // Mock coordinates for demo
    coordinates: {
      lat: 39.7392 + (Math.random() - 0.5) * 0.2,
      lng: -104.9903 + (Math.random() - 0.5) * 0.2
    }
  }));

  return NextResponse.json({
    type: 'jobs',
    data: {
      jobs: jobsData,
      center: {
        lat: 39.7392,
        lng: -104.9903
      },
      zoom: 10
    }
  });
} 