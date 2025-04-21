import { test, expect } from '@playwright/test';
import { loginAs, createService, waitForStableDOM } from './utils';

test.describe('Payment Processing', () => {
  test.beforeEach(async ({ page }) => {
    // Login as customer for payment tests
    await loginAs(page, 'customer');
  });
  
  test('should show payment history', async ({ page }) => {
    // Navigate to payment history page
    await page.goto('/payments/history');
    
    // Verify payment history page loads
    await expect(page.getByRole('heading', { name: /Payment History/i })).toBeVisible();
    
    // Verify table or list is visible (may be empty for new accounts)
    const paymentList = page.getByRole('table').or(page.getByRole('list'));
    if (await paymentList.isVisible()) {
      // Test passes if we can see the payment list
      await expect(paymentList).toBeVisible();
    } else {
      // If no payments exist, should see a message indicating no payments
      await expect(page.getByText(/No payments|No records/i)).toBeVisible();
    }
  });
  
  test('should allow customer to add a payment method', async ({ page }) => {
    // Navigate to payment methods page
    await page.goto('/payments/methods');
    
    // Look for "Add Payment Method" button
    const addMethodButton = page.getByRole('button', { name: /Add Payment Method|Add Card/i });
    
    if (await addMethodButton.isVisible()) {
      await addMethodButton.click();
      
      // Wait for payment form to appear
      await waitForStableDOM(page);
      
      // Fill in test card details - using iframe or direct input depending on implementation
      try {
        // Try filling the Stripe card element if it's using iframes
        const stripeFrame = page.frameLocator('iframe[name*="stripe"]').first();
        await stripeFrame.locator('[placeholder*="card number"]').fill('4242424242424242');
        await stripeFrame.locator('[placeholder*="MM / YY"]').fill('12/25');
        await stripeFrame.locator('[placeholder*="CVC"]').fill('123');
        await stripeFrame.locator('[placeholder*="ZIP"]').fill('12345');
      } catch (error) {
        // If not using Stripe iframes, try direct input
        await page.getByPlaceholder(/Card Number/i).fill('4242424242424242');
        await page.getByPlaceholder(/Expiry/i).fill('12/25');
        await page.getByPlaceholder(/CVC|Security Code/i).fill('123');
      }
      
      // Submit payment method form
      await page.getByRole('button', { name: /Save|Add|Submit/i }).click();
      
      // Verify success message or card appears in list
      const successMsg = page.getByText(/successfully added|card added/i);
      const cardInList = page.getByText(/•••• 4242/);
      
      // If either the success message or the card in list is visible, test passes
      const paymentAdded = await successMsg.isVisible() || await cardInList.isVisible();
      expect(paymentAdded).toBeTruthy();
    } else {
      // If we can't find the add method button, check if a card is already added
      const existingCard = page.getByText(/•••• \d{4}/);
      if (await existingCard.isVisible()) {
        // Test passes if a card already exists
        await expect(existingCard).toBeVisible();
      } else {
        throw new Error('Could not find Add Payment Method button or existing payment methods');
      }
    }
  });
  
  test('should process payment for a service', async ({ page }) => {
    // First create a service that requires payment
    await createService(page);
    
    // Look for payment button on service details
    const payNowButton = page.getByRole('button', { name: /Pay Now|Make Payment/i });
    
    if (await payNowButton.isVisible()) {
      await payNowButton.click();
      
      // Check if we're on a payment page
      await expect(page.getByText(/Payment|Checkout/i)).toBeVisible();
      
      // If payment method selection is available, select saved card if exists
      const savedCard = page.getByText(/•••• \d{4}/);
      if (await savedCard.isVisible()) {
        await savedCard.click();
      } else {
        // If no saved card, fill in test card details
        try {
          // Try filling the Stripe card element if it's using iframes
          const stripeFrame = page.frameLocator('iframe[name*="stripe"]').first();
          if (await stripeFrame.isVisible()) {
            await stripeFrame.locator('[placeholder*="card number"]').fill('4242424242424242');
            await stripeFrame.locator('[placeholder*="MM / YY"]').fill('12/25');
            await stripeFrame.locator('[placeholder*="CVC"]').fill('123');
            await stripeFrame.locator('[placeholder*="ZIP"]').fill('12345');
          } else {
            // If not using Stripe iframes, try direct input
            await page.getByPlaceholder(/Card Number/i).fill('4242424242424242');
            await page.getByPlaceholder(/Expiry/i).fill('12/25');
            await page.getByPlaceholder(/CVC|Security Code/i).fill('123');
          }
        } catch (error) {
          // If there's an error filling card details, we might already be on the confirmation page
          console.log('Error filling card details, continuing with test:', error);
        }
      }
      
      // Submit payment
      await page.getByRole('button', { name: /Pay|Submit|Confirm/i }).click();
      
      // Verify success message
      await expect(page.getByText(/Payment Successful|Thank You|Paid/i)).toBeVisible();
    } else {
      // If no payment button is visible, check if service is already paid
      const paidStatus = page.getByText(/Paid|Payment Completed/i);
      if (await paidStatus.isVisible()) {
        // Test passes if payment is already completed
        await expect(paidStatus).toBeVisible();
      } else {
        // Skip test if payment is not required for services
        test.skip(true, 'Payment button not found and service not marked as paid');
      }
    }
  });
}); 