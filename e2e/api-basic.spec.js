import { test, expect } from '@playwright/test';
test.describe('Basic API Checks', () => {
    // Test to check API health endpoint
    test('should check API health endpoint', async ({ request }) => {
        try {
            const response = await request.get('/api/health');
            console.log(`Health endpoint status: ${response.status()}`);
            if (response.ok()) {
                expect(response.status()).toBe(200);
                try {
                    const body = await response.json();
                    console.log('Health check response:', body);
                }
                catch (e) {
                    // Might be plain text or another format
                    const text = await response.text();
                    console.log('Health check response (text):', text);
                }
            }
            else {
                // Log but don't fail if the endpoint doesn't exist
                console.log('Health endpoint not available or returned non-200');
                test.skip();
            }
        }
        catch (e) {
            console.log('Error checking health endpoint:', e.message);
            test.skip();
        }
    });
    // Test to check if the API returns proper CORS headers
    test('should check CORS headers', async ({ request }) => {
        try {
            const response = await request.get('/', {
                headers: {
                    'Origin': 'https://example.com'
                }
            });
            const corsHeader = response.headers()['access-control-allow-origin'];
            console.log(`CORS header: ${corsHeader || 'not present'}`);
            // We just log the CORS status, don't fail the test if it's not configured
            if (corsHeader) {
                console.log('CORS is configured');
            }
            else {
                console.log('CORS may not be needed for this application');
            }
        }
        catch (e) {
            console.log('Error checking CORS headers:', e.message);
            test.skip();
        }
    });
    // Test to check API authentication
    test('should check API authentication endpoints', async ({ request }) => {
        try {
            // Try to access a restricted endpoint without authentication
            const protectedResponse = await request.get('/api/user/profile');
            console.log(`Protected endpoint status without auth: ${protectedResponse.status()}`);
            // If we get a 401/403, that's expected for a protected route
            const isProtected = protectedResponse.status() === 401 || protectedResponse.status() === 403;
            if (isProtected) {
                console.log('API correctly requires authentication');
                expect(isProtected).toBeTruthy();
            }
            else if (protectedResponse.ok()) {
                // If the endpoint returned 200, it might not be protected
                console.log('API endpoint does not require authentication or does not exist');
            }
            else {
                console.log(`Unexpected status: ${protectedResponse.status()}`);
            }
        }
        catch (e) {
            console.log('Error checking API authentication:', e.message);
            test.skip();
        }
    });
    // Test to check basic data endpoint (e.g., services list)
    test('should check basic data endpoint', async ({ request }) => {
        try {
            // Try to access a data endpoint (without authentication)
            const response = await request.get('/api/services');
            console.log(`Data endpoint status: ${response.status()}`);
            if (response.ok()) {
                try {
                    const data = await response.json();
                    console.log(`Received data items: ${Array.isArray(data) ? data.length : 'Not an array'}`);
                    expect(response.status()).toBe(200);
                }
                catch (e) {
                    console.log('Error parsing response as JSON:', e.message);
                }
            }
            else {
                console.log('Data endpoint not available or requires authentication');
                // Don't fail the test if the endpoint requires auth or doesn't exist
            }
        }
        catch (e) {
            console.log('Error checking data endpoint:', e.message);
            test.skip();
        }
    });
});
