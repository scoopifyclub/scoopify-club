import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/api-auth';

export async function GET(request) {
  try {
    console.log('📊 Fetching consolidated dashboard data...');
    
    // Get token from either cookie
    const token = request.cookies.get('token')?.value || request.cookies.get('accessToken')?.value;
    if (!token) {
      console.log('❌ No token found in cookies');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token and get user
    const decoded = await verifyToken(token);
    if (!decoded) {
      console.log('❌ Token verification failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('👤 Looking up user with ID:', decoded.userId);
    
    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      }
    });

    if (!user || user.role !== 'EMPLOYEE') {
      console.log('❌ Unauthorized - user:', user);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get employee data with service areas - handle potential schema issues
    let employee;
    try {
      employee = await prisma.employee.findUnique({
        where: { userId: user.id },
        include: { 
          serviceAreas: true,
          services: {
            where: {
              status: {
                in: ['SCHEDULED', 'IN_PROGRESS']
              }
            },
            include: {
              customer: {
                include: {
                  address: true,
                  user: true
                }
              },
              servicePlan: true,
              photos: true
            },
            orderBy: {
              scheduledDate: 'asc'
            }
          }
        }
      });
    } catch (schemaError) {
      console.log('❌ Schema error with serviceAreas, trying without includes:', schemaError.message);
      
      // Fallback: get employee without complex includes
      employee = await prisma.employee.findUnique({
        where: { userId: user.id }
      });
      
      if (employee) {
        // Try to get serviceAreas separately
        try {
          const coverageAreas = await prisma.coverageArea.findMany({
            where: { employeeId: employee.id }
          });
          employee.serviceAreas = coverageAreas;
        } catch (coverageError) {
          console.log('❌ Could not fetch coverage areas:', coverageError.message);
          employee.serviceAreas = [];
        }
        
        // Set empty services for now
        employee.services = [];
      }
    }

    if (!employee) {
      console.log('❌ Employee profile not found for user:', user.email);
      
      // Create employee profile if it doesn't exist
      console.log('🆕 Creating employee profile...');
      const newEmployee = await prisma.employee.create({
        data: {
          id: require('uuid').v4(),
          userId: user.id,
          status: 'ACTIVE',
          hasSetServiceArea: false,
          updatedAt: new Date(),
        },
        include: { serviceAreas: true }
      });
      
      console.log('✅ Employee profile created:', newEmployee.id);
      
      return NextResponse.json({
        stats: {
          totalServices: 0,
          completedServices: 0,
          earnings: 0,
          customerCount: 0,
          hasSetServiceArea: false,
          serviceAreas: []
        },
        services: [],
        notifications: {
          unreadCount: 0,
          settings: null
        }
      });
    }

    console.log('📈 Calculating dashboard data for employee:', employee.id);

    // Calculate stats in parallel
    const [
      totalServices,
      completedServices,
      earnings,
      customerCount,
      notifications
    ] = await Promise.all([
      // Total services
      prisma.service.count({ 
        where: { employeeId: employee.id } 
      }),
      
      // Completed services
      prisma.service.count({ 
        where: { 
          employeeId: employee.id, 
          status: 'COMPLETED' 
        } 
      }),
      
      // Total earnings
      prisma.earning.aggregate({
        _sum: { amount: true },
        where: { employeeId: employee.id }
      }),
      
      // Customer count
      prisma.customer.count({ 
        where: { 
          services: { 
            some: { employeeId: employee.id } 
          } 
        } 
      }),
      
      // Notifications
      prisma.notification.findMany({
        where: {
          userId: user.id,
          read: false
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      })
    ]);

    // Get notification settings
    const notificationSettings = await prisma.notificationSettings.findUnique({
      where: { userId: user.id }
    });

    console.log('✅ Dashboard data calculated successfully');

    return NextResponse.json({
      stats: {
        totalServices,
        completedServices,
        earnings: earnings._sum.amount || 0,
        customerCount,
        hasSetServiceArea: employee.hasSetServiceArea,
        serviceAreas: employee.serviceAreas
      },
      services: employee.services,
      notifications: {
        unreadCount: notifications.length,
        recent: notifications,
        settings: notificationSettings
      }
    });

  } catch (error) {
    console.error('❌ Failed to fetch dashboard data:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch dashboard data',
      details: error.message 
    }, { status: 500 });
  }
} 