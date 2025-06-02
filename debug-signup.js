const puppeteer = require('puppeteer');

async function debugSignup() {
  console.log('🔍 Debugging scooper signup form...');
  
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Capture all console messages
  page.on('console', msg => {
    console.log('🖥️  BROWSER:', msg.type().toUpperCase(), msg.text());
  });
  
  // Capture network requests and responses
  page.on('response', async response => {
    const url = response.url();
    const status = response.status();
    
    if (url.includes('/api/') || status >= 400) {
      console.log(`🌐 ${status} ${url}`);
      
      if (status >= 400) {
        try {
          const responseText = await response.text();
          console.log(`📄 Response body: ${responseText}`);
        } catch (e) {
          console.log('📄 Could not read response body');
        }
      }
    }
  });
  
  // Capture network errors
  page.on('requestfailed', request => {
    console.log('❌ NETWORK ERROR:', request.url(), request.failure().errorText);
  });
  
  try {
    await page.goto('https://scoopify.club/auth/scooper-signup', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('✅ Page loaded');
    
    // Fill the form
    console.log('📝 Filling form...');
    await page.type('input[name="firstName"]', 'Test');
    await page.type('input[name="lastName"]', 'Scooper');
    await page.type('input[name="email"]', 'testscooper' + Date.now() + '@example.com'); // Unique email
    await page.type('input[name="phone"]', '1234567890');
    await page.type('input[name="password"]', 'TestPassword123!');
    await page.type('input[name="confirmPassword"]', 'TestPassword123!');
    
    // Add a delay to see the filled form
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('🚀 Submitting form...');
    
    // Wait for any response after clicking submit
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/api/') && response.request().method() === 'POST'
    );
    
    await page.click('button[type="submit"]');
    
    // Wait for API response or timeout
    try {
      const response = await Promise.race([
        responsePromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('No API response after 10 seconds')), 10000))
      ]);
      
      console.log(`📡 API Response: ${response.status()} ${response.url()}`);
      const responseBody = await response.text();
      console.log(`📄 Response: ${responseBody}`);
      
    } catch (e) {
      console.log('⚠️  No API response detected:', e.message);
    }
    
    // Wait for any page changes
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check for error messages on the page
    const errorMessages = await page.evaluate(() => {
      const errors = [];
      
      // Common error selectors
      const errorSelectors = [
        '.error',
        '.alert-error', 
        '.text-red-500',
        '.text-red-600',
        '[class*="error"]',
        '[role="alert"]',
        '.invalid-feedback'
      ];
      
      errorSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          if (el.textContent.trim()) {
            errors.push(el.textContent.trim());
          }
        });
      });
      
      return errors;
    });
    
    if (errorMessages.length > 0) {
      console.log('❌ Error messages found:');
      errorMessages.forEach(msg => console.log(`   - ${msg}`));
    } else {
      console.log('✅ No error messages found');
    }
    
    // Check current URL
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);
    
    // Check if redirected anywhere
    if (currentUrl !== 'https://www.scoopify.club/auth/scooper-signup') {
      console.log('✅ Form submission caused a redirect');
    } else {
      console.log('⚠️  Still on signup page - likely an error occurred');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

debugSignup().catch(console.error); 