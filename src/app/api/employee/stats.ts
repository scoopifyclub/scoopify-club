import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/api-auth';

export async function GET(request) {
  try {
    console.log('📊 Fetching employee stats...');
    
    // Try to get user from either token or accessToken cookie
    const token = request.cookies.get('token')?.value || request.cookies.get('accessToken')?.value;
    if (!token) {
      console.log('❌ No token found in cookies');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      console.log('❌ Token verification failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('👤 Looking up user with ID:', decoded.userId);
    
    // Get the full user data from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      }
    });

    console.log('👤 User found:', user ? `${user.email} (${user.role})` : 'not found');
    
    if (!user || user.role !== 'EMPLOYEE') {
      console.log('❌ Unauthorized - user:', user);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 Looking for employee with userId:', user.id);
    
    const employee = await prisma.employee.findUnique({
      where: { userId: user.id },
      include: { serviceAreas: true }
    });

    console.log('👨‍💼 Employee found:', employee ? 'Yes' : 'No');

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
        totalServices: 0,
        completedServices: 0,
        earnings: 0,
        customerCount: 0,
        hasSetServiceArea: false,
        serviceAreas: []
      });
    }

    console.log('📈 Calculating stats for employee:', employee.id);

    // Calculate stats
    const totalServices = await prisma.service.count({ where: { employeeId: employee.id } });
    const completedServices = await prisma.service.count({ where: { employeeId: employee.id, status: 'COMPLETED' } });
    const earnings = await prisma.earning.aggregate({
      _sum: { amount: true },
      where: { employeeId: employee.id }
    });
    const customerCount = await prisma.customer.count({ where: { services: { some: { employeeId: employee.id } } } });

    console.log('📊 Stats calculated:', { totalServices, completedServices, earnings: earnings._sum.amount, customerCount });

    return NextResponse.json({
      totalServices,
      completedServices,
      earnings: earnings._sum.amount || 0,
      customerCount,
      hasSetServiceArea: employee.hasSetServiceArea,
      serviceAreas: employee.serviceAreas
    });
  } catch (error) {
    console.error('❌ Failed to fetch employee stats:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch employee stats',
      details: error.message 
    }, { status: 500 });
  }
}
