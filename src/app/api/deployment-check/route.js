import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
// Set to run on nodejs runtime for database access
export const runtime = 'nodejs';
/**
 * This endpoint is used to check if the deployment is working correctly.
 * It returns information about the runtime environment and checks critical systems.
 */
export async function GET(request) {
    const startTime = Date.now();
    // Get environment information
    const debugInfo = {
        environment: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
        isVercel: !!process.env.VERCEL,
        nodeVersion: process.version,
    };
    // Check database connectivity (light query)
    let dbStatus = 'unknown';
    let dbError = null;
    try {
        // Use a simple raw query to check connectivity
        await prisma.$queryRaw `SELECT 1 as check_db`;
        dbStatus = 'connected';
    }
    catch (error) {
        dbStatus = 'error';
        dbError = error instanceof Error ? error.message : 'Unknown database error';
    }
    // Calculate response time
    const responseTime = Date.now() - startTime;
    // Collect system checks
    const systemChecks = {
        database: {
            status: dbStatus,
            error: dbError
        },
        environment: process.env.NODE_ENV,
        vercelEnvironment: process.env.VERCEL_ENV || 'not-vercel',
        isVercel: !!process.env.VERCEL,
        responseTime: `${responseTime}ms`
    };
    // Return information
    return NextResponse.json({
        status: 'ok',
        message: 'Deployment check completed',
        timestamp: new Date().toISOString(),
        environment: debugInfo,
        systemChecks,
        headers: {
            // Return the request headers for debugging
            userAgent: request.headers.get('user-agent'),
            host: request.headers.get('host'),
            referer: request.headers.get('referer')
        }
    });
}
