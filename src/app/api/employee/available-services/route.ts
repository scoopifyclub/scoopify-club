import { NextResponse } from 'next/server'
import prisma from "@/lib/prisma";
import { verifyToken } from '@/lib/auth'
import { startOfDay, endOfDay, setHours, isToday, format } from 'date-fns';
import { calculateDistance } from '@/lib/geolocation';

export async function GET(request: Request) {
  try {
    // Extract token for authorization
    const token = request.headers.get('Authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, role } = await verifyToken(token)
    if (role !== 'EMPLOYEE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get employee location from query params if available
    const url = new URL(request.url);
    const latitude = parseFloat(url.searchParams.get('latitude') || '0');
    const longitude = parseFloat(url.searchParams.get('longitude') || '0');
    const hasLocation = latitude !== 0 && longitude !== 0;

    // Get current date and set time boundaries (7am to 7pm today)
    const today = new Date();
    const startTime = setHours(startOfDay(today), 7); // 7am today
    const endTime = setHours(startOfDay(today), 19); // 7pm today
    
    // Get the current day of the week
    const currentDayOfWeek = format(today, 'EEEE');

    // Only show services that match the customer's preferred service day and are scheduled for today
    const services = await prisma.service.findMany({
      where: {
        status: 'SCHEDULED',
        employeeId: null,
        customer: {
          serviceDay: currentDayOfWeek
        },
        scheduledDate: {
          gte: startTime,
          lte: endTime
        }
      },
      include: {
        customer: {
          select: {
            name: true,
            phone: true,
            address: true,
            gateCode: true,
            serviceDay: true
          }
        },
        location: true,
        servicePlan: true
      }
    });

    // Calculate distance and potential earnings for each service
    const servicesWithDistance = services.map(service => {
      let distance = null;
      
      // Calculate distance if both employee and service location are available
      if (hasLocation && service.location) {
        distance = calculateDistance(
          latitude,
          longitude,
          service.location.latitude,
          service.location.longitude
        );
      }

      // Always calculate potentialEarnings as 75% of the service price
      const potentialEarnings = service.servicePlan.price * 0.75;

      return {
        ...service,
        distance,
        potentialEarnings
      };
    });

    // Sort by distance if available, otherwise by scheduled date
    const sortedServices = hasLocation
      ? servicesWithDistance.sort((a, b) => {
          if (a.distance === null && b.distance === null) return 0;
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        })
      : servicesWithDistance.sort((a, b) => 
          new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
        );

    return NextResponse.json(sortedServices);
  } catch (error) {
    console.error('Available services error:', error)
    return NextResponse.json({ error: 'Failed to fetch available services' }, { status: 500 })
  }
} 