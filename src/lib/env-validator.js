import { z } from 'zod';

// Helper function to handle URL validation with Vercel URL support
function createUrlSchema(isOptional = false) {
    let schema = z.string().refine(
        (url) => {
            try {
                if (url.startsWith('https://') || url.startsWith('http://')) {
                    new URL(url);
                    return true;
                }
                return false;
            } catch {
                return false;
            }
        },
        { message: 'Invalid URL format' }
    );

    if (isOptional) {
        schema = schema.optional();
    }

    return schema;
}

// Define the expected environment variables and their types
const envSchema = z.object({
    // Database configuration
    DATABASE_URL: createUrlSchema(),
    DIRECT_URL: createUrlSchema(true),
    // Authentication
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
    JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters long'),
    // Stripe integration
    STRIPE_SECRET_KEY: z.string().startsWith('sk_', 'Invalid Stripe secret key format'),
    STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_', 'Invalid Stripe publishable key format'),
    STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_', 'Invalid Stripe webhook secret format'),
    // Vercel-specific
    VERCEL: z.string().optional(),
    VERCEL_ENV: z.enum(['development', 'preview', 'production']).optional(),
    VERCEL_URL: z.string().optional(),
    VERCEL_REGION: z.string().optional(),
    VERCEL_GIT_COMMIT_SHA: z.string().optional(),
    VERCEL_GIT_COMMIT_REF: z.string().optional(),
    // API URL
    NEXT_PUBLIC_API_URL: createUrlSchema(true),
    NEXT_PUBLIC_APP_URL: createUrlSchema(true),
    // Optional environment variables
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().optional().transform(val => val ? parseInt(val) : 3000),
    CRON_SECRET: z.string().min(16, 'CRON_SECRET must be at least 16 characters long'),
});

// Function to validate environment variables
export function validateEnv() {
    try {
        const env = process.env;
        
        // Handle Vercel-specific URL configuration
        if (env.VERCEL_URL) {
            const vercelUrl = `https://${env.VERCEL_URL}`;
            
            // Set API URL if not explicitly set
            if (!env.NEXT_PUBLIC_API_URL) {
                env.NEXT_PUBLIC_API_URL = vercelUrl;
                console.log('Setting NEXT_PUBLIC_API_URL from VERCEL_URL:', vercelUrl);
            }

            // Set APP URL if not explicitly set
            if (!env.NEXT_PUBLIC_APP_URL) {
                env.NEXT_PUBLIC_APP_URL = vercelUrl;
                console.log('Setting NEXT_PUBLIC_APP_URL from VERCEL_URL:', vercelUrl);
            }
        } else if (env.NODE_ENV === 'development') {
            // Set default development URLs if not set
            const devUrl = 'http://localhost:3000';
            if (!env.NEXT_PUBLIC_API_URL) env.NEXT_PUBLIC_API_URL = devUrl;
            if (!env.NEXT_PUBLIC_APP_URL) env.NEXT_PUBLIC_APP_URL = devUrl;
        }

        // Parse and validate environment variables
        const validatedEnv = envSchema.parse(env);

        // Log environment info in non-production environments
        if (env.NODE_ENV !== 'production') {
            console.log('\n🔧 Environment Configuration:');
            console.log(`- Node Environment: ${env.NODE_ENV}`);
            console.log(`- Vercel Environment: ${env.VERCEL_ENV || 'local'}`);
            console.log(`- API URL: ${env.NEXT_PUBLIC_API_URL}`);
            console.log(`- APP URL: ${env.NEXT_PUBLIC_APP_URL}`);
        }

        return validatedEnv;
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error('\n🛑 Environment Validation Failed 🛑');
            
            const { missingVars, invalidVars } = error.errors.reduce((acc, err) => {
                if (err.code === 'invalid_type' && err.received === 'undefined') {
                    acc.missingVars.push(err.path.join('.'));
                } else {
                    acc.invalidVars.push(`${err.path.join('.')}: ${err.message}`);
                }
                return acc;
            }, { missingVars: [], invalidVars: [] });

            if (missingVars.length > 0) {
                console.error('\nMissing required environment variables:');
                missingVars.forEach(variable => console.error(` - ${variable}`));
            }

            if (invalidVars.length > 0) {
                console.error('\nInvalid environment variables:');
                invalidVars.forEach(message => console.error(` - ${message}`));
            }

            console.error('\nPlease check your:');
            console.error(' - .env file for local development');
            console.error(' - Vercel project settings for deployment');
            console.error(' - Environment variables in your CI/CD pipeline\n');

            // In development, throw an error to prevent starting with missing vars
            if (process.env.NODE_ENV === 'development') {
                throw new Error('Environment validation failed');
            }

            // In production, log the error but allow the app to start
            console.warn('⚠️ Starting application despite environment validation failure');
            return process.env;
        }
        throw error;
    }
}

// Export the validated environment variables
let validatedEnv = null;

export function getEnv() {
    if (!validatedEnv) {
        validatedEnv = validateEnv();
    }
    return validatedEnv;
}

// Export specific environment getters
export const getVercelEnv = () => getEnv().VERCEL_ENV;
export const isProduction = () => getEnv().NODE_ENV === 'production';
export const isDevelopment = () => getEnv().NODE_ENV === 'development';
export const isTest = () => getEnv().NODE_ENV === 'test';
export const isVercel = () => !!getEnv().VERCEL;

// Export URL getters
export const getApiUrl = () => getEnv().NEXT_PUBLIC_API_URL;
export const getAppUrl = () => getEnv().NEXT_PUBLIC_APP_URL;
