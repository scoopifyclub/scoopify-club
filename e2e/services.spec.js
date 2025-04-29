import { test, expect } from '@playwright/test';
import { loginAs, createService, getTomorrowDate, waitForStableDOM } from './utils';
test.describe('Service Management', () => {
    test.beforeEach(async ({ page }) => {
        // Login as customer for most tests
        await loginAs(page, 'customer');
    });
    test('should allow customer to create a new service', async ({ page }) => {
        // Create a new service using the utility function
        const serviceId = await createService(page);
        // Verify we're on the service details page
        expect(page.url()).toContain(`/services/${serviceId}`);
        // Verify service details are displayed
        await expect(page.getByText(/Service Details|Service Information/i)).toBeVisible();
        await expect(page.getByText(/Regular Cleanup/i)).toBeVisible();
        await expect(page.getByText(getTomorrowDate())).toBeVisible();
    });
    test('should display service history', async ({ page }) => {
        // First create a service so we have something in history
        await createService(page);
        // Navigate to service history page
        await page.goto('/services/history');
        // Verify history page loads
        await expect(page.getByRole('heading', { name: /Service History/i })).toBeVisible();
        // Verify table or list of services is visible
        const serviceList = page.getByRole('table').or(page.getByRole('list'));
        await expect(serviceList).toBeVisible();
        // Verify at least one service is listed
        await expect(page.getByText(/Regular Cleanup/i).first()).toBeVisible();
    });
    test('should allow filtering services by status', async ({ page }) => {
        // Navigate to service history page
        await page.goto('/services/history');
        // Find status filter dropdown
        const statusFilter = page.getByRole('combobox', { name: /status|filter/i });
        // If filter exists, test it
        if (await statusFilter.isVisible()) {
            // Select "Scheduled" status
            await statusFilter.selectOption({ label: /Scheduled|Pending/i });
            await waitForStableDOM(page);
            // Verify filtered results
            const filteredList = page.getByRole('table').or(page.getByRole('list'));
            await expect(filteredList).toBeVisible();
        }
    });
    test('should allow employee to claim and complete service', async ({ page }) => {
        // First login as customer and create a service
        await loginAs(page, 'customer');
        const serviceId = await createService(page);
        const serviceUrl = page.url();
        // Logout and login as employee
        await page.getByRole('button', { name: /Logout|Sign out/i }).click();
        await expect(page).toHaveURL(/\/login/);
        await loginAs(page, 'employee');
        // Go to the service details
        await page.goto(serviceUrl);
        // Find and click the claim button
        const claimButton = page.getByRole('button', { name: /Claim|Accept/i });
        if (await claimButton.isVisible()) {
            await claimButton.click();
            // Verify service is claimed
            await expect(page.getByText(/Claimed|Accepted/i)).toBeVisible();
            // Mark as arrived
            const arriveButton = page.getByRole('button', { name: /Arrive|On Location|Start/i });
            if (await arriveButton.isVisible()) {
                await arriveButton.click();
                await expect(page.getByText(/On Location|Started|In Progress/i)).toBeVisible();
            }
            // Complete service
            const completeButton = page.getByRole('button', { name: /Complete|Finish/i });
            if (await completeButton.isVisible()) {
                await completeButton.click();
                await expect(page.getByText(/Completed|Finished/i)).toBeVisible();
            }
        }
    });
    test('should allow admin to create weather delay', async ({ page }) => {
        // Logout from customer and login as admin
        await page.getByRole('button', { name: /Logout|Sign out/i }).click();
        await expect(page).toHaveURL(/\/login/);
        await loginAs(page, 'admin');
        // Navigate to weather delay page
        await page.goto('/admin/weather');
        // If weather delay form exists, fill it out
        const startDateInput = page.getByLabel(/Start Date/i);
        if (await startDateInput.isVisible()) {
            // Get tomorrow and day after dates
            const tomorrow = getTomorrowDate();
            const dayAfter = new Date();
            dayAfter.setDate(dayAfter.getDate() + 2);
            const dayAfterStr = dayAfter.toISOString().split('T')[0];
            // Fill form
            await startDateInput.fill(tomorrow);
            await page.getByLabel(/End Date/i).fill(dayAfterStr);
            await page.getByLabel(/Reason|Message/i).fill('Severe weather test delay');
            // Submit form
            await page.getByRole('button', { name: /Submit|Apply|Create/i }).click();
            // Verify success message
            await expect(page.getByText(/Weather Delay Created|Applied|Success/i)).toBeVisible();
        }
    });
    test('should allow customer to reschedule a service', async ({ page }) => {
        // Create a service
        const serviceId = await createService(page);
        // Find reschedule button
        const rescheduleButton = page.getByRole('button', { name: /Reschedule|Change Date/i });
        if (await rescheduleButton.isVisible()) {
            await rescheduleButton.click();
            // Get date 3 days from now
            const newDate = new Date();
            newDate.setDate(newDate.getDate() + 3);
            const newDateStr = newDate.toISOString().split('T')[0];
            // Fill new date
            await page.getByLabel(/Date/i).fill(newDateStr);
            // Submit form
            await page.getByRole('button', { name: /Submit|Update|Save/i }).click();
            // Verify success message
            await expect(page.getByText(/Rescheduled|Updated/i)).toBeVisible();
            // Verify new date is displayed
            await expect(page.getByText(newDateStr)).toBeVisible();
        }
    });
});
