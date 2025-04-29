/**
 * Vercel Runtime Helper
 *
 * This file provides utility functions for working with Vercel environment
 * and ensuring compatibility across different runtimes.
 */
// Check if running in Vercel environment
export function isVercel() {
    return !!process.env.VERCEL;
}
// Check if running in Vercel Edge runtime
export function isEdgeRuntime() {
    return typeof EdgeRuntime !== 'undefined';
}
// Check if running in Node.js runtime
export function isNodeRuntime() {
    return !isEdgeRuntime() && typeof process !== 'undefined' && !!process.version;
}
// Get the current runtime type
export function getRuntimeType() {
    if (isEdgeRuntime())
        return 'edge';
    if (isNodeRuntime())
        return 'nodejs';
    if (typeof window !== 'undefined')
        return 'browser';
    return 'unknown';
}
// Get deployment region in Vercel
export function getVercelRegion() {
    return process.env.VERCEL_REGION || null;
}
// Check if deployment is in production
export function isProduction() {
    return process.env.NODE_ENV === 'production';
}
// Get a safe value for environment variables
export function getEnvSafe(key) {
    return process.env[key] || '';
}
// Get database connection type based on environment
export function getDatabaseConnectionType() {
    if (!process.env.DATABASE_URL)
        return 'none';
    if (isVercel() && isProduction())
        return 'pooled';
    return 'direct';
}
// Get the Vercel deployment ID
export function getDeploymentId() {
    return process.env.VERCEL_DEPLOYMENT_ID || null;
}
// Get runtime diagnostics for debugging
export function getRuntimeDiagnostics() {
    return {
        runtime: getRuntimeType(),
        isVercel: isVercel(),
        isProduction: isProduction(),
        nodeVersion: isNodeRuntime() ? process.version : null,
        region: getVercelRegion(),
        deploymentId: getDeploymentId(),
        databaseConnectionType: getDatabaseConnectionType(),
    };
}
