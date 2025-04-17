import { prisma } from '@/lib/prisma';
import { getDistance } from 'geolib';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface ServiceRequest {
  scheduledFor: Date;
  address: {
    latitude: number;
    longitude: number;
    zipCode: string;
  };
}

interface Employee {
  id: string;
  userId: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
  serviceAreas: Array<{
    zipCode: string;
    isPrimary: boolean;
  }>;
  currentLocation?: Coordinates;
  maxDailyServices: number;
}

export async function findBestEmployee(serviceRequest: ServiceRequest) {
  // Get all active employees who cover the service area
  const employees = await prisma.employee.findMany({
    where: {
      status: 'ACTIVE',
      serviceAreas: {
        some: {
          zipCode: serviceRequest.address.zipCode
        }
      }
    },
    include: {
      serviceAreas: true,
      services: {
        where: {
          scheduledFor: {
            gte: new Date(
              serviceRequest.scheduledFor.getFullYear(),
              serviceRequest.scheduledFor.getMonth(),
              serviceRequest.scheduledFor.getDate()
            )
          }
        }
      }
    }
  });

  if (employees.length === 0) {
    return null;
  }

  // Calculate scores for each employee
  const employeeScores = await Promise.all(
    employees.map(async (employee) => {
      // Get employee's current location (last service location or home base)
      const lastService = await prisma.service.findFirst({
        where: {
          employeeId: employee.id,
          status: 'COMPLETED'
        },
        orderBy: {
          completedAt: 'desc'
        },
        include: {
          address: true
        }
      });

      const currentLocation = lastService
        ? {
            latitude: lastService.address.latitude,
            longitude: lastService.address.longitude
          }
        : await getEmployeeHomeBase(employee.id);

      // Calculate distance score (0-100, lower is better)
      const distance = currentLocation
        ? getDistance(
            currentLocation,
            {
              latitude: serviceRequest.address.latitude,
              longitude: serviceRequest.address.longitude
            }
          )
        : 0;
      const distanceScore = Math.min(100, (distance / 1000) * 10); // 10 points per km, max 100

      // Calculate workload score (0-100, lower is better)
      const dailyServices = employee.services.filter(
        (service) =>
          service.scheduledFor.getDate() === serviceRequest.scheduledFor.getDate()
      ).length;
      const workloadScore = (dailyServices / employee.maxDailyServices) * 100;

      // Calculate area familiarity score (0-100, higher is better)
      const isPrimaryArea = employee.serviceAreas.some(
        (area) => area.zipCode === serviceRequest.address.zipCode && area.isPrimary
      );
      const familiarityScore = isPrimaryArea ? 100 : 50;

      // Calculate final score (lower is better)
      const finalScore = distanceScore * 0.4 + workloadScore * 0.4 - familiarityScore * 0.2;

      return {
        employee,
        score: finalScore,
        metrics: {
          distance: distance,
          distanceScore,
          workloadScore,
          familiarityScore,
          dailyServices
        }
      };
    })
  );

  // Sort by score (lower is better) and filter out overloaded employees
  const validEmployees = employeeScores
    .filter((e) => e.metrics.dailyServices < e.employee.maxDailyServices)
    .sort((a, b) => a.score - b.score);

  return validEmployees[0]?.employee || null;
}

async function getEmployeeHomeBase(employeeId: string): Promise<Coordinates> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      address: true
    }
  });

  if (!employee?.address) {
    throw new Error('Employee home base not found');
  }

  return {
    latitude: employee.address.latitude,
    longitude: employee.address.longitude
  };
}

export async function checkEmployeeAvailability(
  employeeId: string,
  scheduledFor: Date
): Promise<boolean> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      services: {
        where: {
          scheduledFor: {
            gte: new Date(
              scheduledFor.getFullYear(),
              scheduledFor.getMonth(),
              scheduledFor.getDate()
            ),
            lt: new Date(
              scheduledFor.getFullYear(),
              scheduledFor.getMonth(),
              scheduledFor.getDate() + 1
            )
          }
        }
      },
      timeOff: {
        where: {
          startDate: {
            lte: scheduledFor
          },
          endDate: {
            gte: scheduledFor
          }
        }
      }
    }
  });

  if (!employee) {
    return false;
  }

  // Check if employee is on leave
  if (employee.timeOff.length > 0) {
    return false;
  }

  // Check if employee has reached their daily service limit
  if (employee.services.length >= employee.maxDailyServices) {
    return false;
  }

  // Check for time conflicts (assuming 1-hour service duration)
  const serviceHour = scheduledFor.getHours();
  const hasConflict = employee.services.some(
    (service) => service.scheduledFor.getHours() === serviceHour
  );

  return !hasConflict;
}

export async function optimizeRoute(employeeId: string, date: Date) {
  // Get all services for the employee on the given date
  const services = await prisma.service.findMany({
    where: {
      employeeId,
      scheduledFor: {
        gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
      }
    },
    include: {
      address: true
    }
  });

  if (services.length <= 1) {
    return services;
  }

  // Get employee's starting location (home address)
  const startLocation = await getEmployeeHomeBase(employeeId);

  // Sort services by distance from previous location
  const sortedServices = services.reduce(
    (acc: typeof services, _: typeof services[0]) => {
      const lastLocation =
        acc.length > 0
          ? {
              latitude: acc[acc.length - 1].address.latitude,
              longitude: acc[acc.length - 1].address.longitude
            }
          : startLocation;

      const nextService = services
        .filter((s) => !acc.includes(s))
        .reduce((nearest, service) => {
          const distance = getDistance(lastLocation, {
            latitude: service.address.latitude,
            longitude: service.address.longitude
          });

          const nearestDistance = nearest
            ? getDistance(lastLocation, {
                latitude: nearest.address.latitude,
                longitude: nearest.address.longitude
              })
            : Infinity;

          return distance < nearestDistance ? service : nearest;
        });

      if (nextService) {
        acc.push(nextService);
      }

      return acc;
    },
    []
  );

  return sortedServices;
} 