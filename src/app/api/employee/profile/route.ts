import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET handler to fetch employee profile data
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get email from query params
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { message: 'Email parameter is required' },
        { status: 400 }
      )
    }

    // Verify that the requester is fetching their own profile
    if (email !== session.user.email) {
      return NextResponse.json(
        { message: 'You can only access your own profile' },
        { status: 403 }
      )
    }

    // Fetch employee profile from database
    const employee = await prisma.employee.findUnique({
      where: { email },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })

    if (!employee) {
      return NextResponse.json(
        { message: 'Employee profile not found' },
        { status: 404 }
      )
    }

    // Combine employee and user data
    const profileData = {
      ...employee,
      name: employee.user.name,
      email: employee.user.email,
      image: employee.user.image,
    }

    return NextResponse.json(profileData)
  } catch (error) {
    console.error('Error fetching employee profile:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT handler to update employee profile
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get update data from request body
    const updateData = await request.json()
    const { email } = updateData

    // Verify that the requester is updating their own profile
    if (email !== session.user.email) {
      return NextResponse.json(
        { message: 'You can only update your own profile' },
        { status: 403 }
      )
    }

    // Check if employee exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { email },
      include: { user: true },
    })

    if (!existingEmployee) {
      return NextResponse.json(
        { message: 'Employee profile not found' },
        { status: 404 }
      )
    }

    // Split update data between user and employee tables
    const userUpdateData: any = {}
    const employeeUpdateData: any = {}

    // Fields to update in the user table
    if (updateData.name) userUpdateData.name = updateData.name

    // Fields to update in the employee table
    if (updateData.phone) employeeUpdateData.phone = updateData.phone
    if (updateData.bio) employeeUpdateData.bio = updateData.bio
    if (updateData.experienceYears !== undefined) employeeUpdateData.experienceYears = updateData.experienceYears
    if (updateData.specialties) employeeUpdateData.specialties = updateData.specialties
    if (updateData.certifications) employeeUpdateData.certifications = updateData.certifications
    if (updateData.paymentInfo) employeeUpdateData.paymentInfo = updateData.paymentInfo
    if (updateData.availabilityHours) employeeUpdateData.availabilityHours = updateData.availabilityHours
    if (updateData.preferredServiceAreas) employeeUpdateData.preferredServiceAreas = updateData.preferredServiceAreas
    
    // Payment related fields
    if (updateData.cashAppUsername !== undefined) employeeUpdateData.cashAppUsername = updateData.cashAppUsername
    if (updateData.stripeAccountId !== undefined) employeeUpdateData.stripeAccountId = updateData.stripeAccountId
    if (updateData.preferredPaymentMethod !== undefined) employeeUpdateData.preferredPaymentMethod = updateData.preferredPaymentMethod

    // Update user and employee data in a transaction
    const [updatedUser, updatedEmployee] = await prisma.$transaction([
      prisma.user.update({
        where: { id: existingEmployee.userId },
        data: userUpdateData,
      }),
      prisma.employee.update({
        where: { email },
        data: employeeUpdateData,
      }),
    ])

    // Combine the updated data
    const updatedProfileData = {
      ...updatedEmployee,
      name: updatedUser.name,
      email: updatedUser.email,
      image: updatedUser.image,
    }

    return NextResponse.json(updatedProfileData)
  } catch (error) {
    console.error('Error updating employee profile:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 