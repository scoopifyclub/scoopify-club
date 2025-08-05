import { NextResponse } from 'next/server';
import { withApiSecurity } from '@/lib/security-middleware';
import { prisma } from '@/lib/prisma';

async function handler(req) {
    try {
        if (req.method === 'POST') {
            // Submit service completion verification
            const { serviceId, employeeId, photos, notes, completionTime } = await req.json();
            
            if (!serviceId || !employeeId) {
                return NextResponse.json({ error: 'Service ID and Employee ID are required' }, { status: 400 });
            }
            
            // Create quality control record
            const qualityRecord = await prisma.qualityControl.create({
                data: {
                    serviceId: parseInt(serviceId),
                    employeeId: parseInt(employeeId),
                    photos: photos || [],
                    notes,
                    completionTime: completionTime ? new Date(completionTime) : new Date(),
                    status: 'COMPLETED'
                }
            });
            
            // Update service status
            await prisma.service.update({
                where: { id: parseInt(serviceId) },
                data: { status: 'COMPLETED' }
            });
            
            return NextResponse.json({ success: true, qualityRecord }, { status: 201 });
            
        } else if (req.method === 'GET') {
            // Get quality control records
            const { serviceId, employeeId, status } = req.nextUrl.searchParams;
            
            const where = {};
            if (serviceId) where.serviceId = parseInt(serviceId);
            if (employeeId) where.employeeId = parseInt(employeeId);
            if (status) where.status = status;
            
            const records = await prisma.qualityControl.findMany({
                where,
                include: {
                    service: true,
                    employee: {
                        include: { user: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
            
            return NextResponse.json({ success: true, records });
            
        } else {
            return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
        }
        
    } catch (error) {
        console.error('Quality control error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export const GET = withApiSecurity(handler, { requireAuth: true });
export const POST = withApiSecurity(handler, { requireAuth: true }); 