import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { withErrorHandler } from '@/lib/error-handler';
// Use Node.js runtime for database access
export const runtime = 'nodejs';
/**
 * Health Check Endpoint
 *
 * This endpoint serves as a health check for the application.
 * It verifies the database connection and returns status information.
 */
export const GET = withErrorHandler(async (request) => {
    const startTime = Date.now();
    // Status object to track health of various components
    const status = {
        uptime: process.uptime(),
        timestamp: Date.now(),
        database: {
            status: 'unknown'
        }
    };
    // Check database connection
    try {
        // Simple query to verify database connection
        await prisma.$queryRaw `SELECT 1 as health_check`;
        status.database.status = 'ok';
    }
    catch (error) {
        status.database.status = 'error';
        status.database.error = error instanceof Error ? error.message : 'Unknown database error';
    }
    // Calculate response time
    const responseTime = Date.now() - startTime;
    return NextResponse.json(Object.assign({ status: 'ok', timestamp: new Date().toISOString(), responseTime: `${responseTime}ms`, environment: process.env.NODE_ENV }, status));
});
