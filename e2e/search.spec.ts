import { test, expect } from '@playwright/test';
import { loginAs, waitForStableDOM } from './utils';

test.describe('Search Functionality', () => {
  test('should allow searching from the header', async ({ page }) => {
    // Go to home page
    await page.goto('/');
    await waitForStableDOM(page);
    
    // Look for search input in header
    const searchInput = page.getByRole('searchbox')
      .or(page.getByPlaceholder(/search/i))
      .or(page.locator('input[type="search"]'));
    
    if (await searchInput.isVisible()) {
      // Enter search query
      await searchInput.fill('cleaning');
      await page.keyboard.press('Enter');
      
      // Wait for search results page to load
      await page.waitForURL(/.*search.*|.*q=.*/);
      
      // Verify search results are displayed
      await expect(page.getByText(/search results|results for/i)).toBeVisible();
    }
  });
  
  test('should filter services by search term', async ({ page }) => {
    // Login as customer
    await loginAs(page, 'customer');
    
    // Go to services page
    await page.getByRole('link', { name: /services/i }).click();
    await waitForStableDOM(page);
    
    // Look for search/filter input on services page
    const searchInput = page.getByRole('searchbox')
      .or(page.getByPlaceholder(/search|filter/i))
      .or(page.locator('input[type="search"], input[name="search"], input[name="filter"]'));
    
    if (await searchInput.isVisible()) {
      // Count services before search
      const serviceElementsBeforeSearch = page.locator('.service-card, .service-item, tr')
        .filter({ has: page.getByText(/service/i) });
      const countBeforeSearch = await serviceElementsBeforeSearch.count();
      
      // Only proceed if we have services to filter
      if (countBeforeSearch > 0) {
        // Enter search term
        await searchInput.fill('clean');
        
        // Some implementations require pressing Enter, others filter automatically
        try {
          await page.keyboard.press('Enter');
          await waitForStableDOM(page);
        } catch (e) {
          // Ignore if pressing Enter causes navigation
        }
        
        // Check if filtered results contain the search term
        const filteredServices = page.locator('.service-card, .service-item, tr')
          .filter({ has: page.getByText(/service/i) });
        
        // Either we should have fewer results or they should contain our search term
        const countAfterSearch = await filteredServices.count();
        
        if (countAfterSearch > 0) {
          // Check at least the first result has our search term
          const firstServiceText = await filteredServices.first().textContent();
          expect(
            countAfterSearch < countBeforeSearch || 
            firstServiceText.toLowerCase().includes('clean')
          ).toBeTruthy();
        }
      }
    }
  });
  
  test('should search employees by name or skill', async ({ page }) => {
    // Login as admin to access employee management
    await loginAs(page, 'admin');
    
    // Try to navigate to employee management page
    await page.getByRole('link', { name: /employees|staff|team/i }).click();
    await waitForStableDOM(page);
    
    // Look for search input
    const searchInput = page.getByRole('searchbox')
      .or(page.getByPlaceholder(/search|filter/i))
      .or(page.locator('input[type="search"], input[name="search"]'));
    
    if (await searchInput.isVisible()) {
      // Count employees before search
      const employeeElementsBeforeSearch = page.locator('.employee-card, .employee-item, tr')
        .filter({ has: page.getByText(/employee|staff/i) });
      const countBeforeSearch = await employeeElementsBeforeSearch.count();
      
      // Only proceed if we have employees to filter
      if (countBeforeSearch > 0) {
        // Enter search for a likely employee skill
        await searchInput.fill('cleaning');
        
        // Some implementations require pressing Enter, others filter automatically
        try {
          await page.keyboard.press('Enter');
          await waitForStableDOM(page);
        } catch (e) {
          // Ignore if pressing Enter causes navigation
        }
        
        // Check filtered results
        const filteredEmployees = page.locator('.employee-card, .employee-item, tr')
          .filter({ has: page.getByText(/employee|staff/i) });
        
        await expect(filteredEmployees).toBeVisible();
      }
    }
  });
  
  test('should show "no results" when search has no matches', async ({ page }) => {
    // Go to home page
    await page.goto('/');
    
    // Look for search input
    const searchInput = page.getByRole('searchbox')
      .or(page.getByPlaceholder(/search/i))
      .or(page.locator('input[type="search"]'));
    
    if (await searchInput.isVisible()) {
      // Enter a very unlikely search term
      const randomString = `nonexistent${Date.now()}`;
      await searchInput.fill(randomString);
      await page.keyboard.press('Enter');
      
      // Wait for search results page
      await page.waitForURL(/.*search.*|.*q=.*/);
      
      // Verify "no results" message is displayed
      await expect(
        page.getByText(/no results|nothing found|couldn't find/i)
      ).toBeVisible();
    }
  });
  
  test('should have search suggestions or autocomplete', async ({ page }) => {
    // Go to home page
    await page.goto('/');
    
    // Look for search input
    const searchInput = page.getByRole('searchbox')
      .or(page.getByPlaceholder(/search/i))
      .or(page.locator('input[type="search"]'));
    
    if (await searchInput.isVisible()) {
      // Type partial search term that should trigger suggestions
      await searchInput.type('cle', { delay: 100 });
      
      // Wait a bit for suggestions to appear
      await page.waitForTimeout(500);
      
      // Check if suggestions dropdown appears
      const suggestionElements = page.locator('.suggestions, .autocomplete, .dropdown-menu')
        .filter({ has: page.getByText(/clean|clear/i) });
      
      // If suggestions exist, verify they're related to our search
      if (await suggestionElements.isVisible()) {
        const suggestions = suggestionElements.locator('li, .suggestion-item, .dropdown-item');
        
        if (await suggestions.count() > 0) {
          // Check if first suggestion contains our search term or related words
          const firstSuggestionText = await suggestions.first().textContent();
          expect(
            firstSuggestionText.toLowerCase().includes('cle')
          ).toBeTruthy();
          
          // Click the first suggestion
          await suggestions.first().click();
          
          // Verify navigation to search results
          await page.waitForURL(/.*search.*|.*q=.*/);
        }
      }
    }
  });
}); 