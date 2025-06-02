const puppeteer = require('puppeteer');

async function testApp() {
  console.log('🚀 Starting Puppeteer test for scoopify.club...');
  
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Enable console logging from the page
  page.on('console', msg => {
    console.log('🖥️  BROWSER CONSOLE:', msg.type().toUpperCase(), msg.text());
  });
  
  // Capture network requests
  page.on('response', response => {
    const url = response.url();
    const status = response.status();
    if (url.includes('/api/') || status >= 400) {
      console.log(`🌐 ${status} ${url}`);
    }
  });
  
  // Capture network errors
  page.on('requestfailed', request => {
    console.log('❌ NETWORK ERROR:', request.url(), request.failure().errorText);
  });
  
  try {
    console.log('\n📍 Testing homepage...');
    await page.goto('https://scoopify.club', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Check if page loaded
    const title = await page.title();
    console.log('✅ Homepage loaded. Title:', title);
    
    // Test scooper signup
    console.log('\n📍 Testing scooper signup page...');
    await page.goto('https://scoopify.club/auth/scooper-signup', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    const signupTitle = await page.title();
    console.log('✅ Signup page loaded. Title:', signupTitle);
    
    // Check for any loading states or errors
    const hasLoading = await page.$('text=Loading...');
    if (hasLoading) {
      console.log('⚠️  Found "Loading..." on signup page');
    }
    
    // Try to sign up a scooper
    console.log('\n📍 Testing scooper signup form...');
    
    // Fill signup form with only the fields that exist
    await page.type('input[name="firstName"]', 'Test');
    await page.type('input[name="lastName"]', 'Scooper');
    await page.type('input[name="email"]', 'testscooper@example.com');
    await page.type('input[name="phone"]', '1234567890');
    await page.type('input[name="password"]', 'TestPassword123!');
    await page.type('input[name="confirmPassword"]', 'TestPassword123!');
    
    // Submit form
    console.log('📝 Submitting signup form...');
    await page.click('button[type="submit"]');
    
    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check current URL and page content
    const currentUrl = page.url();
    console.log('📍 Current URL after signup:', currentUrl);
    
    // Check for success or error messages
    const pageContent = await page.content();
    if (pageContent.includes('error') || pageContent.includes('Error')) {
      console.log('❌ Found error on page');
      // Get error text
      const errorElement = await page.$('.error, .alert-error, [class*="error"]');
      if (errorElement) {
        const errorText = await errorElement.textContent();
        console.log('❌ Error message:', errorText);
      }
    }
    
    // If redirected to dashboard, test it
    if (currentUrl.includes('/employee/dashboard') || currentUrl.includes('/dashboard')) {
      console.log('\n📍 Testing employee dashboard...');
      
      // Wait for dashboard to load
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Check if still loading
      const dashboardLoading = await page.$('text=Loading...');
      if (dashboardLoading) {
        console.log('❌ Dashboard stuck on "Loading..."');
        
        // Check what API requests are being made
        const apiRequests = [];
        page.on('response', response => {
          if (response.url().includes('/api/')) {
            apiRequests.push({
              url: response.url(),
              status: response.status()
            });
          }
        });
        
        // Wait a bit more to capture requests
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log('🔍 API requests made:', apiRequests);
        
        // Check for specific API calls
        const authCall = await page.evaluate(() => {
          return fetch('/api/auth/me', { credentials: 'include' })
            .then(r => ({ status: r.status, ok: r.ok }))
            .catch(e => ({ error: e.message }));
        });
        console.log('🔐 Auth API test:', authCall);
        
        const dashboardCall = await page.evaluate(() => {
          return fetch('/api/employee/dashboard', { credentials: 'include' })
            .then(r => ({ status: r.status, ok: r.ok }))
            .catch(e => ({ error: e.message }));
        });
        console.log('📊 Dashboard API test:', dashboardCall);
        
      } else {
        console.log('✅ Dashboard loaded successfully');
      }
    }
    
    // Test signin page (if we can find it)
    console.log('\n📍 Testing scooper signin page...');
    
    // Try common signin URLs
    const signinUrls = [
      'https://scoopify.club/auth/signin',
      'https://scoopify.club/auth/scooper-signin', 
      'https://scoopify.club/employee/login'
    ];
    
    for (const url of signinUrls) {
      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });
        const loginTitle = await page.title();
        console.log(`✅ Signin page found at ${url}. Title: ${loginTitle}`);
        break;
      } catch (e) {
        console.log(`❌ No signin page at ${url}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
    console.log('\n✅ Test completed!');
  }
}

// Run the test
testApp().catch(console.error); 