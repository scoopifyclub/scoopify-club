import { z } from 'zod';
// Define the expected environment variables and their types
const envSchema = z.object({
    // Database configuration
    DATABASE_URL: z.string().url(),
    DIRECT_URL: z.string().url().optional(),
    // Authentication
    JWT_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    // NextAuth
    NEXTAUTH_SECRET: z.string().min(32),
    NEXTAUTH_URL: z.string().url(),
    // Stripe integration
    STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
    STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
    STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
    // Vercel-specific
    CRON_SECRET: z.string().min(16),
    // API URL
    NEXT_PUBLIC_API_URL: z.string().url().optional(),
    // Optional environment variables
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    VERCEL_ENV: z.enum(['development', 'preview', 'production']).optional(),
    VERCEL_URL: z.string().optional(),
    PORT: z.string().optional().transform(val => val ? parseInt(val) : 3000),
});
// Function to validate environment variables
export function validateEnv() {
    try {
        // Parse all environment variables through our schema
        return envSchema.parse(process.env);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            const missingVars = error.errors
                .filter(err => err.code === 'invalid_type' && err.received === 'undefined')
                .map(err => err.path.join('.'));
            const invalidVars = error.errors
                .filter(err => !(err.code === 'invalid_type' && err.received === 'undefined'))
                .map(err => `${err.path.join('.')}: ${err.message}`);
            console.error('\n🛑 Environment Validation Failed 🛑');
            if (missingVars.length > 0) {
                console.error('\nMissing required environment variables:');
                missingVars.forEach(variable => console.error(` - ${variable}`));
            }
            if (invalidVars.length > 0) {
                console.error('\nInvalid environment variables:');
                invalidVars.forEach(message => console.error(` - ${message}`));
            }
            console.error('\nPlease check your .env files or Vercel environment variables.\n');
            // In development, we'll throw an error to prevent starting with missing vars
            if (process.env.NODE_ENV === 'development') {
                throw new Error('Missing required environment variables');
            }
            else {
                // In production, we'll log the error but allow the app to start
                // This prevents deployment failures due to environment issues
                console.error('Starting application despite environment validation failure.');
                return process.env;
            }
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
