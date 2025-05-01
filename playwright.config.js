const { defineConfig } = require('@playwright/test');
import dotenv from 'dotenv';
// Load test environment variables
dotenv.config({ path: '.env.test' });

module.exports = defineConfig({
    testDir: './tests',
    timeout: 30000,
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        baseURL: 'https://www.scoopify.club',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: {
                browserName: 'chromium',
            },
        },
        {
            name: 'firefox',
            use: {
                browserName: 'firefox',
            },
        },
        {
            name: 'webkit',
            use: {
                browserName: 'webkit',
            },
        },
    ],
    webServer: process.env.CI ? {
        command: 'npm run build && npm run start',
        url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 60000,
    } : undefined,
});
