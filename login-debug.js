// login-debug.js
const { chromium } = require('playwright');

async function debugLogin() {
  console.log('Starting login debugging session...');
  
  // Launch a headless browser
  const browser = await chromium.launch({
    headless: true
  });
  
  // Create a new context (session)
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  });
  
  // Database-related error keywords to look for
  const dbErrorKeywords = [
    'connection pool',
    'failed to connect',
    'Connection timed out',
    'PrismaClientInitializationError',
    'rate limit',
    'database connection',
    'too many connections',
    'connection refused'
  ];
  
  // Session-related keywords to look for
  const sessionErrorKeywords = [
    'no session found',
    'session expired',
    'invalid token',
    'token verification failed',
    'unauthorized'
  ];
  
  // Network request tracking
  let requests = [];
  let responses = [];
  
  // Enable request/response logging with enhanced error detection
  context.on('request', request => {
    const url = request.url();
    requests.push({
      method: request.method(),
      url: url,
      time: Date.now(),
      resourceType: request.resourceType()
    });
    
    if (url.includes('api/auth') || url.includes('api/session')) {
      console.log(`>> ${request.method()} ${url}`);
      if (request.postData()) {
        try {
          const data = JSON.parse(request.postData());
          // Mask the password for security
          if (data.password) {
            data.password = '********';
          }
          console.log('Request data:', data);
        } catch (e) {
          console.log('Request data:', request.postData());
        }
      }
    }
  });
  
  context.on('response', response => {
    const url = response.url();
    const status = response.status();
    
    responses.push({
      url: url,
      status: status,
      time: Date.now()
    });
    
    if (url.includes('api/auth') || 
        url.includes('api/session') ||
        url.includes('api/refresh')) {
      console.log(`<< ${status} ${url}`);
      response.text().then(text => {
        try {
          const data = JSON.parse(text);
          console.log('Response data:', data);
          
          // Check for database error indicators in the response
          const responseStr = JSON.stringify(data).toLowerCase();
          const foundDbErrors = dbErrorKeywords.filter(keyword => 
            responseStr.includes(keyword.toLowerCase())
          );
          
          if (foundDbErrors.length > 0) {
            console.log('🚨 DATABASE ERROR DETECTED in response:', foundDbErrors);
          }
          
          // Check for session error indicators
          const foundSessionErrors = sessionErrorKeywords.filter(keyword => 
            responseStr.includes(keyword.toLowerCase())
          );
          
          if (foundSessionErrors.length > 0) {
            console.log('🚨 SESSION ERROR DETECTED in response:', foundSessionErrors);
          }
        } catch (e) {
          if (text.length < 500) {
            console.log('Response text:', text);
            
            // Check for database error indicators in plain text response
            const textLower = text.toLowerCase();
            const foundDbErrors = dbErrorKeywords.filter(keyword => 
              textLower.includes(keyword.toLowerCase())
            );
            
            if (foundDbErrors.length > 0) {
              console.log('🚨 DATABASE ERROR DETECTED in response text:', foundDbErrors);
            }
            
            // Check for session error indicators
            const foundSessionErrors = sessionErrorKeywords.filter(keyword => 
              textLower.includes(keyword.toLowerCase())
            );
            
            if (foundSessionErrors.length > 0) {
              console.log('🚨 SESSION ERROR DETECTED in response text:', foundSessionErrors);
            }
          } else {
            console.log('Response text: (large response, truncated)');
            
            // Still check the truncated text for errors
            const textLower = text.toLowerCase();
            const foundDbErrors = dbErrorKeywords.filter(keyword => 
              textLower.includes(keyword.toLowerCase())
            );
            
            if (foundDbErrors.length > 0) {
              console.log('🚨 DATABASE ERROR DETECTED in large response:', foundDbErrors);
            }
            
            const foundSessionErrors = sessionErrorKeywords.filter(keyword => 
              textLower.includes(keyword.toLowerCase())
            );
            
            if (foundSessionErrors.length > 0) {
              console.log('🚨 SESSION ERROR DETECTED in large response:', foundSessionErrors);
            }
          }
        }
      }).catch(err => {
        console.log('Could not get response text:', err.message);
      });
    }
  });
  
  // Create a new page
  const page = await context.newPage();
  
  // Monitor console logs for error messages
  page.on('console', msg => {
    const text = msg.text();
    
    // Only log errors and warnings
    if (msg.type() === 'error' || msg.type() === 'warning' || text.includes('error') || text.includes('failed')) {
      console.log(`Browser console ${msg.type()}: ${text}`);
      
      // Check for database error indicators in console logs
      const textLower = text.toLowerCase();
      const foundDbErrors = dbErrorKeywords.filter(keyword => 
        textLower.includes(keyword.toLowerCase())
      );
      
      if (foundDbErrors.length > 0) {
        console.log('🚨 DATABASE ERROR DETECTED in console logs:', foundDbErrors);
      }
      
      // Check for session error indicators
      const foundSessionErrors = sessionErrorKeywords.filter(keyword => 
        textLower.includes(keyword.toLowerCase())
      );
      
      if (foundSessionErrors.length > 0) {
        console.log('🚨 SESSION ERROR DETECTED in console logs:', foundSessionErrors);
      }
    }
  });
  
  try {
    console.log('Navigating to login page...');
    // Navigate to the login page
    await page.goto('https://scoopify.club/login');
    await page.waitForLoadState('networkidle');
    console.log('Login page loaded');
    
    // Take screenshot of initial page
    await page.screenshot({ path: 'login-page-initial.png' });
    
    // Check if login form is present
    const loginForm = await page.$('form');
    if (!loginForm) {
      console.log('Login form not found');
      // Take a screenshot to see what's on the page
      await page.screenshot({ path: 'login-page-no-form.png' });
      console.log('Screenshot saved as login-page-no-form.png');
      
      // Try to get page content for debugging
      const content = await page.content();
      console.log('Page content length:', content.length);
      if (content.length < 1000) {
        console.log('Page content:', content);
      } else {
        console.log('Page content too large to display fully');
      }
      
      return;
    }
    
    console.log('Login form found, filling credentials...');
    
    // Fill in the login form with demo credentials
    await page.fill('input[type="email"]', 'demo@example.com');
    await page.fill('input[type="password"]', 'demo123');
    
    console.log('Submitting login form...');
    
    // Start performance measurements
    const startTime = Date.now();
    
    // Submit the form and wait for navigation
    try {
      await Promise.all([
        page.waitForResponse(resp => resp.url().includes('api/auth/login'), { timeout: 20000 }),
        page.click('button[type="submit"]')
      ]);
      
      console.log(`Login request completed in ${Date.now() - startTime}ms`);
    } catch (timeoutError) {
      console.log(`⚠️ Timed out waiting for login response after ${Date.now() - startTime}ms`);
      await page.screenshot({ path: 'login-timeout.png' });
    }
    
    // Wait a moment to see if we're redirected
    await page.waitForTimeout(5000);
    
    // Check if we were redirected to dashboard or stayed on login page
    console.log('Current URL after login attempt:', page.url());
    
    // Try to make a direct API call to check session
    try {
      const sessionResponse = await page.evaluate(async () => {
        try {
          const response = await fetch('/api/auth/session', {
            method: 'GET',
            credentials: 'include'
          });
          const data = await response.json();
          return {
            status: response.status,
            data: data
          };
        } catch (error) {
          return {
            error: error.message
          };
        }
      });
      
      console.log('Direct session check result:', sessionResponse);
    } catch (error) {
      console.error('Failed to check session directly:', error.message);
    }
    
    // Check if we were redirected to dashboard or stayed on login page
    if (page.url().includes('dashboard')) {
      console.log('SUCCESS: Login successful, redirected to dashboard');
      
      // Try to access session data if available
      try {
        await page.goto('https://scoopify.club/api/session/check', { timeout: 10000 });
        const sessionData = await page.content();
        console.log('Session check data:', sessionData.length < 500 ? sessionData : '(large response)');
      } catch (e) {
        console.log('Failed to check session data:', e.message);
      }
    } else {
      console.log('FAILURE: Login failed, still on login page or error page');
      
      // Try to find error messages
      const errorMessages = await page.$$eval('div[role="alert"], .error, .alert, [data-error]', 
        elements => elements.map(el => el.textContent || el.innerText)
      );
      
      if (errorMessages.length > 0) {
        console.log('Error messages displayed:', errorMessages);
      } else {
        // Try a more generic approach if no error elements found
        const bodyText = await page.textContent('body');
        const errorKeywords = ['error', 'invalid', 'failed', 'incorrect', 'problem', 'issue'];
        for (const keyword of errorKeywords) {
          if (bodyText.toLowerCase().includes(keyword)) {
            console.log(`Page contains error keyword: ${keyword}`);
          }
        }
      }
      
      // Check cookies
      const cookies = await context.cookies();
      console.log('Cookies present:', cookies.map(c => c.name));
      
      // Check if authentication cookies were set
      const authCookies = cookies.filter(c => 
        ['token', 'refreshToken', 'fingerprint', 'adminToken'].includes(c.name)
      );
      
      if (authCookies.length > 0) {
        console.log('Authentication cookies found:', authCookies.map(c => c.name));
        console.log('⚠️ Authentication cookies exist but redirect failed - possible session validation issue');
        
        // Check cookie properties for potential issues
        for (const cookie of authCookies) {
          console.log(`Cookie details for ${cookie.name}:`, {
            secure: cookie.secure,
            httpOnly: cookie.httpOnly,
            sameSite: cookie.sameSite,
            path: cookie.path,
            expires: cookie.expires ? new Date(cookie.expires * 1000).toISOString() : 'session',
            domain: cookie.domain
          });
          
          // Check for common issues
          if (!cookie.secure && process.env.NODE_ENV === 'production') {
            console.log(`⚠️ Cookie ${cookie.name} is not secure but site uses HTTPS`);
          }
          
          if (cookie.sameSite === 'strict') {
            console.log(`ℹ️ Cookie ${cookie.name} uses SameSite=strict which may cause issues with redirects`);
          }
          
          if (!cookie.httpOnly) {
            console.log(`⚠️ Cookie ${cookie.name} is not httpOnly and could be vulnerable to XSS`);
          }
        }
      } else {
        console.log('⚠️ No authentication cookies found - login API call likely failed');
      }
      
      // Check local storage 
      const localStorage = await page.evaluate(() => {
        let items = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          items[key] = localStorage.getItem(key);
        }
        return items;
      });
      console.log('localStorage items:', Object.keys(localStorage));
    }
    
    // Print network request summary
    console.log('--- Network Summary ---');
    console.log(`Total requests made: ${requests.length}`);
    console.log(`Total responses received: ${responses.length}`);
    
    // Look for failed requests
    const failedResponses = responses.filter(r => r.status >= 400);
    if (failedResponses.length > 0) {
      console.log(`Failed responses (${failedResponses.length}):`);
      failedResponses.forEach(r => {
        console.log(`  ${r.status} ${r.url}`);
      });
    }
    
    // Take a screenshot of the final state
    await page.screenshot({ path: 'login-result.png' });
    console.log('Screenshot saved as login-result.png');
    
  } catch (error) {
    console.error('Error during login debugging:', error);
    await page.screenshot({ path: 'login-error.png' });
  } finally {
    console.log('Closing browser...');
    await browser.close();
  }
}

debugLogin().catch(console.error); 