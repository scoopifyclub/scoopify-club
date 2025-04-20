import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    // 1. Auth check
    const cookieStore = await cookies();
    const token = cookieStore.get('adminToken')?.value;

    if (!token) {
      console.log('No admin token found in cookies');
      return NextResponse.json(
        { error: 'Unauthorized', details: 'No admin token found' },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'ADMIN') {
      console.log('Invalid token or not admin:', decoded?.role);
      return NextResponse.json(
        { error: 'Unauthorized', details: 'Invalid admin token' },
        { status: 401 }
      );
    }

    // 2. First check if we can count customers
    try {
      const customerCount = await prisma.customer.count();
      console.log(`Total customers in database: ${customerCount}`);
    } catch (countError) {
      console.error('Failed to count customers:', countError);
    }

    // 3. Fetch customers with detailed error handling
    try {
      // First try to get just the customers without relationships
      const basicCustomers = await prisma.customer.findMany();
      console.log(`Found ${basicCustomers.length} basic customers`);

      // Then get the full data
      const customers = await prisma.customer.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true
            }
          },
          address: true,
          subscription: {
            include: {
              plan: true
            }
          }
        }
      });

      console.log(`Successfully fetched ${customers.length} customers with relationships`);

      const formattedCustomers = customers.map(customer => {
        // Log each customer's data structure for debugging
        console.log(`Processing customer ${customer.id}:`, {
          hasUser: !!customer.user,
          hasAddress: !!customer.address,
          hasSubscription: !!customer.subscription
        });

        return {
          id: customer.id,
          user: customer.user ? {
            id: customer.user.id,
            name: customer.user.name,
            email: customer.user.email,
            phone: customer.user.phone,
            role: customer.user.role
          } : null,
          address: customer.address ? {
            street: customer.address.street,
            city: customer.address.city,
            state: customer.address.state,
            zipCode: customer.address.zipCode,
            country: customer.address.country
          } : null,
          phone: customer.phone,
          stripeCustomerId: customer.stripeCustomerId,
          cashappName: customer.cashappName,
          serviceDay: customer.serviceDay,
          subscription: customer.subscription ? {
            id: customer.subscription.id,
            status: customer.subscription.status,
            startDate: customer.subscription.startDate,
            endDate: customer.subscription.endDate,
            plan: customer.subscription.plan ? {
              id: customer.subscription.plan.id,
              name: customer.subscription.plan.name,
              price: customer.subscription.plan.price,
              type: customer.subscription.plan.type,
              duration: customer.subscription.plan.duration
            } : null
          } : null,
          createdAt: customer.createdAt,
          updatedAt: customer.updatedAt
        };
      });

      return NextResponse.json({
        success: true,
        customers: formattedCustomers,
        total: formattedCustomers.length
      });

    } catch (dbError) {
      console.error('Database query error:', dbError);

      if (dbError instanceof Prisma.PrismaClientKnownRequestError) {
        console.error('Prisma error details:', {
          code: dbError.code,
          message: dbError.message,
          meta: dbError.meta
        });

        switch (dbError.code) {
          case 'P2021':
            return NextResponse.json(
              { error: 'Database Error', details: 'Required table not found. Database might need migration.' },
              { status: 500 }
            );
          case 'P2002':
            return NextResponse.json(
              { error: 'Database Error', details: 'Unique constraint violation' },
              { status: 400 }
            );
          case 'P2025':
            return NextResponse.json(
              { error: 'Database Error', details: 'Record not found' },
              { status: 404 }
            );
          default:
            return NextResponse.json(
              { error: 'Database Error', details: `Prisma error: ${dbError.code}` },
              { status: 500 }
            );
        }
      }

      if (dbError instanceof Prisma.PrismaClientValidationError) {
        console.error('Prisma validation error:', dbError.message);
        return NextResponse.json(
          { error: 'Database Error', details: 'Invalid query structure' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Database Error', details: 'An unexpected database error occurred' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Unexpected error in GET /api/admin/customers:', error);
    return NextResponse.json(
      { 
        error: 'Server Error',
        details: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 