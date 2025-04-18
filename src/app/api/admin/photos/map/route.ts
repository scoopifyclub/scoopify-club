import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    // Verify admin authorization
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all services with photos that have GPS coordinates
    const services = await prisma.service.findMany({
      where: {
        photos: {
          some: {
            latitude: { not: null },
            longitude: { not: null }
          }
        }
      },
      include: {
        photos: {
          where: {
            latitude: { not: null },
            longitude: { not: null }
          },
          orderBy: { timestamp: 'desc' }
        },
        customer: {
          select: {
            id: true,
            email: true,
            address: true
          }
        },
        employee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Transform the data for the map
    const mapData = services.map(service => {
      // Get the most recent before and after photos
      const beforePhoto = service.photos.find(p => p.type === 'PRE_CLEAN');
      const afterPhoto = service.photos.find(p => p.type === 'POST_CLEAN');

      return {
        serviceId: service.id,
        customer: {
          id: service.customer.id,
          email: service.customer.email,
          address: service.customer.address
        },
        employee: service.employee ? {
          id: service.employee.id,
          name: service.employee.name,
          email: service.employee.email
        } : null,
        location: {
          latitude: beforePhoto?.latitude || afterPhoto?.latitude,
          longitude: beforePhoto?.longitude || afterPhoto?.longitude
        },
        beforePhoto: beforePhoto ? {
          id: beforePhoto.id,
          url: beforePhoto.url,
          timestamp: beforePhoto.timestamp
        } : null,
        afterPhoto: afterPhoto ? {
          id: afterPhoto.id,
          url: afterPhoto.url,
          timestamp: afterPhoto.timestamp
        } : null,
        scheduledDate: service.scheduledDate,
        completedAt: service.completedAt
      };
    });

    return NextResponse.json({ services: mapData });
  } catch (error) {
    console.error('Error fetching map data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 