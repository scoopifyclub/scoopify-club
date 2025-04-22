import { NextResponse } from 'next/server';
import { validateUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import prisma from "@/lib/prisma";



// GET endpoint to retrieve messages for a service
export async function GET(request: Request) {
  try {
    // Check authorization
    // Get access token from cookies
const cookieStore = await cookies();
const accessToken = cookieStore.get('accessToken')?.value;

if (!accessToken) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Validate the token and check role
const { userId, role } = await validateUser(accessToken);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get serviceId from query parameters
    const url = new URL(request.url);
    const serviceId = url.searchParams.get('serviceId');
    
    if (!serviceId) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
    }
    
    // Verify the user has access to this service
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        customer: {
          include: { user: true }
        },
        employee: {
          include: { user: true }
        }
      }
    });
    
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }
    
    // Check if user is authorized to access this service's messages
    const isCustomer = service.customer?.user?.id === userId;
    const isEmployee = service.employee?.user?.id === userId;
    const isAdmin = role === 'ADMIN';
    
    if (!isCustomer && !isEmployee && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Fetch messages for this service
    const messages = await prisma.serviceMessage.findMany({
      where: { serviceId },
      orderBy: { createdAt: 'asc' },
      include: {
        employee: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                image: true
              }
            }
          }
        }
      }
    });
    
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching service messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service messages' },
      { status: 500 }
    );
  }
}

// POST endpoint to create a new message
export async function POST(request: Request) {
  try {
    // Check authorization
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const { serviceId, message } = await request.json();
    
    if (!serviceId || !message) {
      return NextResponse.json({ error: 'Service ID and message are required' }, { status: 400 });
    }
    
    // Verify the service exists
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        customer: {
          include: { user: true }
        },
        employee: {
          include: { user: true }
        }
      }
    });
    
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }
    
    // Check if user is authorized to send messages for this service
    const isCustomer = service.customer?.user?.id === userId;
    const isEmployee = service.employee?.user?.id === userId;
    const isAdmin = role === 'ADMIN';
    
    if (!isCustomer && !isEmployee && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the employee ID (either the assigned employee or for customer/admin, create a system message)
    let employeeId: string;
    
    if (isEmployee) {
      employeeId = service.employee!.id;
    } else {
      // For customers and admins, we need to ensure there's an employee
      if (!service.employee) {
        return NextResponse.json({ 
          error: 'Cannot send message: no employee assigned to this service' 
        }, { status: 400 });
      }
      employeeId = service.employee.id;
    }
    
    // Create the message
    const serviceMessage = await prisma.serviceMessage.create({
      data: {
        serviceId,
        employeeId,
        message
      },
      include: {
        employee: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                image: true
              }
            }
          }
        }
      }
    });
    
    // Also create a notification for the recipient
    if (isCustomer) {
      // Notify the employee
      await prisma.notification.create({
        data: {
          userId: service.employee.user.id,
          type: 'NEW_MESSAGE',
          title: 'New Message',
          message: `${service.customer.user.name || 'Customer'} sent a message regarding service #${serviceId.substring(0, 8)}`,
          data: JSON.stringify({ serviceId })
        }
      });
    } else if (isEmployee || isAdmin) {
      // Notify the customer
      await prisma.notification.create({
        data: {
          userId: service.customer.user.id,
          type: 'NEW_MESSAGE',
          title: 'New Message',
          message: `${service.employee.user.name || 'Your service provider'} sent a message regarding your service`,
          data: JSON.stringify({ serviceId })
        }
      });
    }
    
    return NextResponse.json(serviceMessage);
  } catch (error) {
    console.error('Error creating service message:', error);
    return NextResponse.json(
      { error: 'Failed to create service message' },
      { status: 500 }
    );
  }
} 