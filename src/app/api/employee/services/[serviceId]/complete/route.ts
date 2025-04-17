import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function POST(
  request: Request,
  { params }: { params: { serviceId: string } }
) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, role } = await verifyToken(token)
    if (role !== 'EMPLOYEE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const employee = await prisma.employee.findUnique({
      where: { userId }
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    const { 
      preCleanPhotos, 
      postCleanPhotos, 
      gateClosed,
      checklistItems
    } = await request.json()

    // Validate required fields
    if (!preCleanPhotos || !postCleanPhotos || !Array.isArray(preCleanPhotos) || !Array.isArray(postCleanPhotos)) {
      return NextResponse.json({ error: 'Photos are required' }, { status: 400 })
    }

    if (preCleanPhotos.length < 4 || postCleanPhotos.length < 4) {
      return NextResponse.json({ error: 'At least 4 photos are required for both pre and post clean' }, { status: 400 })
    }

    if (typeof gateClosed !== 'boolean') {
      return NextResponse.json({ error: 'Gate closure status is required' }, { status: 400 })
    }

    // Update service status and add photos
    const service = await prisma.service.update({
      where: {
        id: params.serviceId,
        employeeId: employee.id,
        status: 'IN_PROGRESS'
      },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        photos: {
          create: [
            ...preCleanPhotos.map((url: string) => ({
              url,
              type: 'PRE_CLEAN',
              uploadedAt: new Date()
            })),
            ...postCleanPhotos.map((url: string) => ({
              url,
              type: 'POST_CLEAN',
              uploadedAt: new Date()
            }))
          ]
        },
        checklist: {
          create: {
            gateClosed,
            items: checklistItems || []
          }
        }
      },
      include: {
        customer: {
          select: {
            name: true,
            address: true
          }
        }
      }
    })

    if (!service) {
      return NextResponse.json({ error: 'Service not found or not in progress' }, { status: 404 })
    }

    return NextResponse.json(service)
  } catch (error) {
    console.error('Complete service error:', error)
    return NextResponse.json({ error: 'Failed to complete service' }, { status: 500 })
  }
} 