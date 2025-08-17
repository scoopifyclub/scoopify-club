import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/api-auth';
import { geocodeAddress, calculateDistance } from '@/lib/geolocation';

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
  // Get real coordinates for service areas
  const serviceAreaCoordinates = [];
  for (const zipCode of employee.serviceAreas) {
    try {
      const coordinates = await geocodeAddress(`${zipCode.zipCode}, ${zipCode.state || 'CO'}`);
      if (coordinates) {
        serviceAreaCoordinates.push({
          zipCode: zipCode.zipCode,
          lat: coordinates.lat,
          lng: coordinates.lng,
          name: zipCode.name || `Area ${zipCode.zipCode}`
        });
      }
    } catch (error) {
      console.error(`Failed to geocode ${zipCode.zipCode}:`, error);
      // Fallback to approximate coordinates for Peyton, CO area
      serviceAreaCoordinates.push({
        zipCode: zipCode.zipCode,
        lat: 39.0261,
        lng: -104.4839,
        name: zipCode.name || `Area ${zipCode.zipCode}`
      });
    }
  }

  return NextResponse.json({
    type: 'service-areas',
    data: {
      serviceAreas: serviceAreaCoordinates,
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

  // Create route waypoints with real coordinates
  const waypoints = [];
  for (const service of todaysServices) {
    try {
      const address = service.customer.address;
      if (address) {
        const fullAddress = `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;
        const coordinates = await geocodeAddress(fullAddress);
        
        if (coordinates) {
          waypoints.push({
            id: service.id,
            position: waypoints.length + 1,
            customerName: service.customer.user?.name || 'Unknown Customer',
            address: {
              street: address.street,
              city: address.city,
              state: address.state,
              zipCode: address.zipCode
            },
            scheduledTime: service.scheduledDate,
            estimatedDuration: 30, // minutes
            coordinates: {
              lat: coordinates.lat,
              lng: coordinates.lng
            }
          });
        }
      }
    } catch (error) {
      console.error(`Failed to geocode address for service ${service.id}:`, error);
      // Fallback to approximate coordinates for Peyton, CO area
      waypoints.push({
        id: service.id,
        position: waypoints.length + 1,
        customerName: service.customer.user?.name || 'Unknown Customer',
        address: service.customer.address ? {
          street: service.customer.address.street,
          city: service.customer.address.city,
          state: service.customer.address.state,
          zipCode: service.customer.address.zipCode
        } : null,
        scheduledTime: service.scheduledDate,
        estimatedDuration: 30, // minutes
        coordinates: {
          lat: 39.0261 + (Math.random() - 0.5) * 0.1,
          lng: -104.4839 + (Math.random() - 0.5) * 0.1
        }
      });
    }
  }

  // Calculate route statistics with real distance
  let totalDistance = 0;
  for (let i = 1; i < waypoints.length; i++) {
    const prev = waypoints[i - 1];
    const curr = waypoints[i];
    const distance = calculateDistance(prev.coordinates.lat, prev.coordinates.lng, curr.coordinates.lat, curr.coordinates.lng);
    totalDistance += distance;
  }
  
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
        totalDistance: `${totalDistance.toFixed(2)} miles`,
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
          user: {
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

  const jobsData = [];
  for (const job of availableJobs) {
    try {
      const address = job.customer.address;
      if (address) {
        const fullAddress = `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;
        const coordinates = await geocodeAddress(fullAddress);
        
        if (coordinates) {
          jobsData.push({
            id: job.id,
            customerName: job.customer.user?.name || 'Unknown Customer',
            address: {
              street: address.street,
              city: address.city,
              state: address.state,
              zipCode: address.zipCode
            },
            scheduledDate: job.scheduledDate,
            potentialEarnings: job.potentialEarnings || 0,
            coordinates: {
              lat: coordinates.lat,
              lng: coordinates.lng
            }
          });
        }
      }
    } catch (error) {
      console.error(`Failed to geocode address for job ${job.id}:`, error);
      // Fallback to approximate coordinates for Peyton, CO area
      jobsData.push({
        id: job.id,
        customerName: job.customer.user?.name || 'Unknown Customer',
        address: job.customer.address ? {
          street: job.customer.address.street,
          city: job.customer.address.city,
          state: job.customer.address.state,
          zipCode: job.customer.address.zipCode
        } : null,
        scheduledDate: job.scheduledDate,
        potentialEarnings: job.potentialEarnings || 0,
        coordinates: {
          lat: 39.0261 + (Math.random() - 0.5) * 0.1,
          lng: -104.4839 + (Math.random() - 0.5) * 0.1
        }
      });
    }
  }

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