import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const employees = await prisma.employee.findMany({
      where: { role: 'EMPLOYEE' },
      select: {
        id: true,
        userId: true,
        name: true,
        email: true,
        hasSetServiceArea: true,
        serviceAreas: true,
        createdAt: true
      }
    });

    const results = employees.map(emp => ({
      id: emp.id,
      userId: emp.userId,
      name: emp.name,
      email: emp.email,
      hasSetServiceArea: emp.hasSetServiceArea,
      serviceAreaCount: emp.serviceAreas.length,
      createdAt: emp.createdAt
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error('Failed to fetch onboarding status:', error);
    return NextResponse.json({ error: 'Failed to fetch onboarding status' }, { status: 500 });
  }
}
