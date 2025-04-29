/**
 * Runtime Configuration
 *
 * This file provides environment-specific configuration for the application.
 */
// Get base URL for API calls
export function getBaseUrl() {
    // Check for Vercel environment
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }
    // Check for explicitly set API URL
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }
    // Default to localhost during development
    return process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : '';
}
// Get application environment
export function getEnvironment() {
    return process.env.NODE_ENV || 'development';
}
// Check if we're running in Vercel
export function isVercelEnvironment() {
    return !!process.env.VERCEL;
}
// Get Vercel environment type (development, preview, or production)
export function getVercelEnvironment() {
    return process.env.VERCEL_ENV;
}
// Get debug information
export function getDebugInfo() {
    return {
        environment: getEnvironment(),
        isVercel: isVercelEnvironment(),
        vercelEnv: getVercelEnvironment(),
        baseUrl: getBaseUrl(),
        nodeVersion: process.version,
    };
}
