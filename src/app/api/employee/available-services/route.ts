import { NextResponse } from 'next/server'
import prisma from "@/lib/prisma";
import { verifyToken } from '@/lib/auth'
import { startOfDay, endOfDay, setHours, isToday, format, isAfter, isBefore } from 'date-fns';
import { calculateDistance } from '@/lib/geolocation';

export async function GET(request: Request) {
  try {
    // Extract token for authorization
    const token = request.headers.get('Authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== 'EMPLOYEE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get employee location from query params if available
    const url = new URL(request.url);
    const latitude = parseFloat(url.searchParams.get('latitude') || '0');
    const longitude = parseFloat(url.searchParams.get('longitude') || '0');
    const hasLocation = latitude !== 0 && longitude !== 0;

    // Get current date and set time boundaries (7am to 7pm today)
    const today = new Date();
    const now = new Date();
    const sevenAM = setHours(startOfDay(today), 7); // 7am today
    const sevenPM = setHours(startOfDay(today), 19); // 7pm today
    
    // Check if current time is outside the 7am-7pm window
    if (isBefore(now, sevenAM) || isAfter(now, sevenPM)) {
      return NextResponse.json({
        services: [],
        message: "Services are only available between 7:00 AM and 7:00 PM"
      });
    }
    
    // Get the current day of the week
    const currentDayOfWeek = format(today, 'EEEE');

    // Check if employee already has a claimed service for today
    const employee = await prisma.employee.findUnique({
      where: { userId: decoded.userId },
      include: {
        services: {
          where: {
            scheduledDate: {
              gte: startOfDay(today),
              lt: endOfDay(today)
            },
            status: {
              in: ['ASSIGNED', 'IN_PROGRESS']
            }
          }
        },
        serviceAreas: true
      }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // If employee already has a claimed service for today, return empty list
    if (employee.services.length > 0) {
      return NextResponse.json({
        services: [],
        message: "You already have an active service. Complete it before claiming another."
      });
    }

    // Only show services that match the customer's preferred service day and are scheduled for today
    const services = await prisma.service.findMany({
      where: {
        status: 'SCHEDULED',
        employeeId: null,
        scheduledDate: {
          gte: sevenAM,
          lte: sevenPM
        },
        customer: {
          serviceDay: currentDayOfWeek
        },
        address: {
          zipCode: {
            in: employee.serviceAreas.map(area => area.zipCode)
          }
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
        servicePlan: true
      }
    });

    // Sort services by proximity if location is provided
    let sortedServices = [...services];
    if (hasLocation) {
      // Calculate distance for each service
      sortedServices = services.map(service => {
        const customerAddress = service.customer.address;
        if (customerAddress?.latitude && customerAddress?.longitude) {
          const distance = calculateDistance(
            latitude,
            longitude,
            customerAddress.latitude,
            customerAddress.longitude
          );
          return { ...service, distance };
        }
        return { ...service, distance: 9999 }; // Large distance for unknown locations
      });

      // Sort by distance (closest first)
      sortedServices.sort((a, b) => a.distance - b.distance);
    }

    return NextResponse.json({ 
      services: sortedServices,
      canClaim: true
    });
  } catch (error) {
    console.error('Error fetching available services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available services' },
      { status: 500 }
    );
  }
} 