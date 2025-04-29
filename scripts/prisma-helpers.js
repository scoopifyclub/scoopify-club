/**
 * Helper functions for Prisma database operations during deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Prepare the database for Vercel deployment
 */
function prepareForVercel() {
    console.log('Preparing database for Vercel deployment...');
    
    try {
        // Generate Prisma Client
        execSync('npx prisma generate', { stdio: 'inherit' });
        
        // Run any pending migrations
        if (process.env.DATABASE_URL) {
            execSync('npx prisma migrate deploy', { stdio: 'inherit' });
        } else {
            console.warn('DATABASE_URL not found. Skipping migrations.');
        }
        
        console.log('Database preparation completed successfully.');
    } catch (error) {
        console.error('Error preparing database:', error);
        process.exit(1);
    }
}

/**
 * Reset the database (for development only)
 */
function resetDatabase() {
    if (process.env.NODE_ENV === 'production') {
        console.error('Cannot reset database in production!');
        process.exit(1);
    }

    try {
        execSync('npx prisma migrate reset --force', { stdio: 'inherit' });
        console.log('Database reset completed successfully.');
    } catch (error) {
        console.error('Error resetting database:', error);
        process.exit(1);
    }
}

/**
 * Safely run database migrations
 */
function safeMigrate(name) {
    try {
        if (name) {
            execSync(`npx prisma migrate dev --name ${name}`, { stdio: 'inherit' });
        } else {
            execSync('npx prisma migrate dev', { stdio: 'inherit' });
        }
        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Error running migration:', error);
        process.exit(1);
    }
}

module.exports = {
    prepareForVercel,
    resetDatabase,
    safeMigrate
}; 