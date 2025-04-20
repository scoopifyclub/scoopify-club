import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'EMPLOYEE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const services = await prisma.service.findMany({
      where: {
        employeeId: decoded.id,
        status: {
          in: ['COMPLETED', 'CANCELLED']
        }
      },
      include: {
        customer: {
          select: {
            name: true,
            address: true
          }
        },
        photos: true,
        checklist: true,
        location: true
      },
      orderBy: {
        completedAt: 'desc'
      },
      take: 50 // Limit to last 50 services
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error('Error fetching service history:', error);
    return NextResponse.json({ error: 'Failed to fetch service history' }, { status: 500 });
  }
} 