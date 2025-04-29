import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
export async function dbErrorHandler(request, handler) {
    try {
        return await handler();
    }
    catch (error) {
        console.error('Database error:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Handle known Prisma errors
            switch (error.code) {
                case 'P2002':
                    return new NextResponse('Unique constraint violation', { status: 409 });
                case 'P2025':
                    return new NextResponse('Record not found', { status: 404 });
                case 'P2003':
                    return new NextResponse('Foreign key constraint violation', { status: 400 });
                default:
                    return new NextResponse('Database error', { status: 500 });
            }
        }
        else if (error instanceof Prisma.PrismaClientValidationError) {
            return new NextResponse('Invalid data provided', { status: 400 });
        }
        else if (error instanceof Prisma.PrismaClientInitializationError) {
            return new NextResponse('Database connection error', { status: 503 });
        }
        // For unknown errors, return a generic error
        return new NextResponse('Internal server error', { status: 500 });
    }
}
