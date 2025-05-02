const { chromium } = require('playwright');

async function checkLogoutButton() {
  console.log('Starting logout button diagnostic...');
  
  // Launch a headless browser
  const browser = await chromium.launch({
    headless: true
  });
  
  // Create a new context (session)
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  });
  
  const page = await context.newPage();
  
  try {
    console.log('Logging in...');
    
    // First log in to get access to the dashboard
    await page.goto('https://scoopify.club/login');
    await page.waitForLoadState('networkidle');
    
    // Fill login form
    await page.fill('input[type="email"]', 'demo@example.com');
    await page.fill('input[type="password"]', 'demo123');
    
    // Submit form and wait for navigation
    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('api/auth/login')),
      page.click('button[type="submit"]')
    ]);
    
    // Wait to see if redirect happens
    await page.waitForTimeout(3000);
    
    console.log('Current URL after login:', page.url());
    
    // If not redirected to dashboard, navigate directly
    if (!page.url().includes('dashboard')) {
      await page.goto('https://scoopify.club/customer/dashboard');
      await page.waitForLoadState('networkidle');
      console.log('Navigated directly to dashboard');
    }
    
    console.log('Current URL:', page.url());
    
    // Take screenshot of the dashboard
    await page.screenshot({ path: 'dashboard-full.png', fullPage: true });
    
    // Check for logout button - try multiple selectors that might match
    console.log('Checking for logout button...');
    
    // Log the HTML structure of the sidebar for debugging
    const sidebarHTML = await page.evaluate(() => {
      const sidebar = document.querySelector('aside');
      return sidebar ? sidebar.outerHTML : 'No sidebar found';
    });
    
    console.log('Sidebar HTML structure summary:', 
      sidebarHTML.length > 500 ? 
      sidebarHTML.substring(0, 500) + '... (truncated)' : 
      sidebarHTML
    );
    
    // Try to find the logout button using various selectors
    const logoutButtonData = await page.evaluate(() => {
      const selectors = [
        'button[data-testid="logout-button"]',
        'button:has(.lucide-log-out)',
        'button:has(svg.lucide-log-out)',
        'button:has([class*="LogOut"])',
        'button:contains("Log Out")',
        'button:contains("Sign Out")',
        'button:contains("Logout")',
        'button:contains("Sign out")',
        'button:contains("Logout")'
      ];
      
      const results = {};
      
      for (const selector of selectors) {
        try {
          const elements = document.querySelectorAll(selector);
          results[selector] = {
            found: elements.length > 0,
            count: elements.length,
            visible: Array.from(elements).map(el => {
              const style = window.getComputedStyle(el);
              const rect = el.getBoundingClientRect();
              return {
                display: style.display,
                visibility: style.visibility,
                opacity: style.opacity,
                rect: {
                  top: rect.top,
                  left: rect.left,
                  width: rect.width,
                  height: rect.height
                },
                text: el.innerText || el.textContent,
                hasLogoutIcon: el.innerHTML.includes('log-out') || el.innerHTML.includes('LogOut')
              };
            })
          };
        } catch (e) {
          results[selector] = { error: e.message };
        }
      }
      
      return results;
    });
    
    console.log('Logout button search results:', JSON.stringify(logoutButtonData, null, 2));
    
    // Try to click the logout button if found
    const logoutButton = await page.$('button[data-testid="logout-button"]');
    
    if (logoutButton) {
      console.log('Found logout button by test ID, taking screenshot...');
      
      // Highlight the button for the screenshot
      await page.evaluate(() => {
        const button = document.querySelector('button[data-testid="logout-button"]');
        if (button) {
          button.style.border = '3px solid red';
          button.style.boxShadow = '0 0 10px red';
        }
      });
      
      await page.screenshot({ path: 'logout-button-highlighted.png' });
      
      // Try scrolling to it in case it's off-screen
      await logoutButton.scrollIntoViewIfNeeded();
      console.log('Scrolled to logout button');
      
      await page.screenshot({ path: 'logout-button-scrolled.png' });
    } else {
      console.log('Logout button not found by test ID');
      
      // Try with more generic selector
      const genericLogoutButton = await page.$('button:has(.lucide-log-out)');
      
      if (genericLogoutButton) {
        console.log('Found logout button by icon, taking screenshot...');
        
        // Highlight button
        await page.evaluate(() => {
          const buttons = document.querySelectorAll('button');
          for (const button of buttons) {
            if (button.innerHTML.includes('log-out') || button.innerHTML.includes('LogOut')) {
              button.style.border = '3px solid red';
              button.style.boxShadow = '0 0 10px red';
            }
          }
        });
        
        await page.screenshot({ path: 'logout-button-icon-highlighted.png' });
        
        await genericLogoutButton.scrollIntoViewIfNeeded();
        await page.screenshot({ path: 'logout-button-icon-scrolled.png' });
      } else {
        console.log('No logout button found with icon');
      }
    }
    
    // Check CSS for potential display issues
    console.log('Analyzing CSS properties of sidebar elements...');
    
    const cssIssues = await page.evaluate(() => {
      const sidebar = document.querySelector('aside');
      if (!sidebar) return { error: 'No sidebar found' };
      
      const buttons = sidebar.querySelectorAll('button');
      const issues = [];
      
      for (let i = 0; i < buttons.length; i++) {
        const button = buttons[i];
        const style = window.getComputedStyle(button);
        const rect = button.getBoundingClientRect();
        
        // Check if button might be invisible
        if (style.display === 'none' || 
            style.visibility === 'hidden' || 
            style.opacity === '0' ||
            rect.width === 0 ||
            rect.height === 0) {
          issues.push({
            buttonText: button.innerText || button.textContent,
            buttonHTML: button.innerHTML.slice(0, 100) + '...',
            issue: 'Button might be invisible',
            properties: {
              display: style.display,
              visibility: style.visibility,
              opacity: style.opacity,
              width: rect.width,
              height: rect.height
            }
          });
        }
        
        // Check if button is off-screen
        if (rect.top < 0 || rect.left < 0 || rect.top > window.innerHeight || rect.left > window.innerWidth) {
          issues.push({
            buttonText: button.innerText || button.textContent,
            buttonHTML: button.innerHTML.slice(0, 100) + '...',
            issue: 'Button is off-screen',
            position: {
              top: rect.top,
              left: rect.left,
              viewport: {
                width: window.innerWidth,
                height: window.innerHeight
              }
            }
          });
        }
      }
      
      return issues.length > 0 ? { issues } : { message: 'No CSS issues detected with sidebar buttons' };
    });
    
    console.log('CSS Analysis:', JSON.stringify(cssIssues, null, 2));
    
  } catch (error) {
    console.error('Error during diagnostic:', error);
  } finally {
    await browser.close();
    console.log('Diagnostic complete');
  }
}

checkLogoutButton().catch(console.error); 