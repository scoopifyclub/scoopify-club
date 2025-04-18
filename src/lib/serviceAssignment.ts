import { prisma } from '@/lib/prisma';
import { calculateDistance } from '@/lib/geocoding';

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
    radius: number;
    isPrimary: boolean;
    latitude: number;
    longitude: number;
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
          zipCode: serviceRequest.address.zipCode,
        },
      },
    },
    include: {
      serviceAreas: true,
      services: {
        where: {
          scheduledFor: {
            gte: new Date(serviceRequest.scheduledFor.setHours(0, 0, 0, 0)),
            lt: new Date(serviceRequest.scheduledFor.setHours(23, 59, 59, 999)),
          },
        },
      },
    },
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
          status: 'COMPLETED',
        },
        orderBy: {
          completedAt: 'desc',
        },
        include: {
          location: true,
        },
      });

      const currentLocation = lastService?.location
        ? {
            latitude: lastService.location.latitude,
            longitude: lastService.location.longitude,
          }
        : employee.serviceAreas[0]; // Use first service area as home base

      // Calculate distance score (0-100, lower is better)
      const distance = currentLocation
        ? calculateDistance(currentLocation, serviceRequest.address)
        : 0;
      const distanceScore = Math.min(100, (distance / 10) * 10); // 10 points per mile, max 100

      // Calculate workload score (0-100, lower is better)
      const dailyServices = employee.services.length;
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
      };
    })
  );

  // Sort by score and return the best employee
  employeeScores.sort((a, b) => a.score - b.score);
  return employeeScores[0].employee;
} 