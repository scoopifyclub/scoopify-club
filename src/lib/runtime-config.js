/**
 * Runtime Configuration
 *
 * This file provides environment-specific configuration for the application.
 */
// Get environment type
export function getEnvironment() {
    if (process.env.VERCEL_ENV === 'production') return 'production';
    if (process.env.VERCEL_ENV === 'preview') return 'preview';
    if (process.env.VERCEL_ENV === 'development') return 'development';
    return process.env.NODE_ENV || 'development';
}
// Get base URL for API calls
export function getBaseUrl() {
    // Check for Vercel environment
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }
    
    // Check for custom domain
    if (process.env.NEXT_PUBLIC_SITE_URL) {
        return process.env.NEXT_PUBLIC_SITE_URL;
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
// Get database configuration
export function getDatabaseConfig() {
    return {
        url: process.env.DATABASE_URL,
        directUrl: process.env.DIRECT_URL || process.env.DATABASE_URL,
        connectionLimit: getEnvironment() === 'production' ? 7 : 5,
        poolTimeout: 10,
        idleTimeout: 20
    };
}
// Get security configuration
export function getSecurityConfig() {
    return {
        jwtSecret: process.env.JWT_SECRET,
        jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
        cookieSecret: process.env.COOKIE_SECRET || process.env.JWT_SECRET,
        secureCookies: getEnvironment() === 'production',
        corsOrigins: getCorsOrigins()
    };
}
// Get CORS origins based on environment
function getCorsOrigins() {
    const origins = new Set([
        'localhost:3000',
        'scoopify.club'
    ]);

    // Add Vercel preview URLs
    if (process.env.VERCEL_URL) {
        origins.add(process.env.VERCEL_URL);
    }

    // Add custom domain if configured
    if (process.env.NEXT_PUBLIC_SITE_URL) {
        try {
            const url = new URL(process.env.NEXT_PUBLIC_SITE_URL);
            origins.add(url.host);
        } catch (e) {
            console.warn('Invalid NEXT_PUBLIC_SITE_URL:', e.message);
        }
    }

    return Array.from(origins);
}
// Get analytics configuration
export function getAnalyticsConfig() {
    return {
        enabled: getEnvironment() === 'production',
        vercelAnalytics: true,
        webVitalsLogging: getEnvironment() !== 'production'
    };
}
// Get deployment information
export function getDeploymentInfo() {
    return {
        environment: getEnvironment(),
        deploymentId: process.env.VERCEL_DEPLOYMENT_ID || null,
        gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA || null,
        buildTime: process.env.VERCEL_BUILD_TIME || null
    };
}
