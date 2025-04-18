import { test, expect } from '@playwright/test';

test.describe('Core Functionality Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page before each test
    await page.goto('http://localhost:3001');
  });

  test('User Authentication', async ({ page }) => {
    // Test signup
    await page.getByRole('link', { name: 'Sign Up' }).click();
    await page.getByLabel('First Name').fill('Test');
    await page.getByLabel('Last Name').fill('User');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Phone').fill('555-123-4567');
    await page.getByLabel('Password').fill('Test123!');
    await page.getByLabel('Confirm Password').fill('Test123!');
    await page.getByLabel('Street').fill('123 Test St');
    await page.getByLabel('City').fill('Test City');
    await page.getByLabel('State').fill('CA');
    await page.getByLabel('ZIP Code').fill('12345');
    await page.getByLabel('Service Day').selectOption('MONDAY');
    await page.getByLabel('Plan').selectOption('BASIC');
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Verify successful signup
    await expect(page.getByText('Account created successfully')).toBeVisible();

    // Test login
    await page.getByRole('link', { name: 'Log In' }).click();
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('Test123!');
    await page.getByRole('button', { name: 'Log In' }).click();

    // Verify successful login
    await expect(page.getByText('Welcome, Test')).toBeVisible();
  });

  test('Service Scheduling', async ({ page }) => {
    // Login first
    await page.getByRole('link', { name: 'Log In' }).click();
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('Test123!');
    await page.getByRole('button', { name: 'Log In' }).click();

    // Schedule a service
    await page.getByRole('link', { name: 'Schedule Service' }).click();
    await page.getByLabel('Service Type').selectOption('REGULAR');
    await page.getByLabel('Date').fill(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    await page.getByLabel('Notes').fill('Test service');
    await page.getByRole('button', { name: 'Schedule' }).click();

    // Verify service was scheduled
    await expect(page.getByText('Service scheduled successfully')).toBeVisible();
  });

  test('Employee Assignment', async ({ page }) => {
    // Login as admin
    await page.getByRole('link', { name: 'Log In' }).click();
    await page.getByLabel('Email').fill('admin@example.com');
    await page.getByLabel('Password').fill('Admin123!');
    await page.getByRole('button', { name: 'Log In' }).click();

    // Assign employee to service
    await page.getByRole('link', { name: 'Services' }).click();
    await page.getByRole('button', { name: 'Assign Employee' }).first().click();
    await page.getByLabel('Employee').selectOption('1'); // Assuming employee ID 1 exists
    await page.getByRole('button', { name: 'Assign' }).click();

    // Verify assignment
    await expect(page.getByText('Employee assigned successfully')).toBeVisible();
  });

  test('Photo Upload', async ({ page }) => {
    // Login as employee
    await page.getByRole('link', { name: 'Log In' }).click();
    await page.getByLabel('Email').fill('employee@example.com');
    await page.getByLabel('Password').fill('Employee123!');
    await page.getByRole('button', { name: 'Log In' }).click();

    // Upload photos
    await page.getByRole('link', { name: 'My Jobs' }).click();
    await page.getByRole('button', { name: 'Upload Photos' }).first().click();
    
    // Upload test photos
    const fileInput = page.getByLabel('Upload Photos');
    await fileInput.setInputFiles([
      'tests/fixtures/before.jpg',
      'tests/fixtures/after.jpg'
    ]);
    
    await page.getByRole('button', { name: 'Upload' }).click();

    // Verify upload
    await expect(page.getByText('Photos uploaded successfully')).toBeVisible();
  });

  test('Payment Processing', async ({ page }) => {
    // Login as customer
    await page.getByRole('link', { name: 'Log In' }).click();
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('Test123!');
    await page.getByRole('button', { name: 'Log In' }).click();

    // Process payment
    await page.getByRole('link', { name: 'Billing' }).click();
    await page.getByRole('button', { name: 'Pay Now' }).click();
    
    // Fill in test card details
    await page.frameLocator('iframe[name="stripe-frame"]').getByLabel('Card number').fill('4242 4242 4242 4242');
    await page.frameLocator('iframe[name="stripe-frame"]').getByLabel('Expiration date').fill('12/25');
    await page.frameLocator('iframe[name="stripe-frame"]').getByLabel('CVC').fill('123');
    await page.getByRole('button', { name: 'Pay' }).click();

    // Verify payment
    await expect(page.getByText('Payment successful')).toBeVisible();
  });
}); 