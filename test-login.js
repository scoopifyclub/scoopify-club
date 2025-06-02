const puppeteer = require('puppeteer');

async function testLogin() {
  console.log('🔍 Testing login process...');
  
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
          console.log(`📄 Error response: ${responseText}`);
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
    // Go to signin page
    console.log('\n📍 Going to signin page...');
    await page.goto('https://scoopify.club/auth/signin', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('✅ Signin page loaded');
    
    // Check what form fields exist
    const loginFields = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      return inputs.map(input => ({
        name: input.name,
        id: input.id,
        type: input.type,
        placeholder: input.placeholder
      }));
    });
    
    console.log('\n📋 Login form fields:');
    loginFields.forEach((field, index) => {
      console.log(`${index + 1}. Name: "${field.name}", ID: "${field.id}", Type: ${field.type}`);
    });
    
    // Try to log in with test credentials
    console.log('\n🔐 Attempting to log in...');
    
    // Fill login form (adjust selectors based on actual form)
    try {
      await page.type('#email', 'matt29680@gmail.com');
      await page.type('#password', '96z^@GTH%c4My&u');
      
      console.log('📝 Form filled, submitting...');
      
      // Click submit button - find it properly
      const submitButton = await page.$('button[type="submit"]');
      if (submitButton) {
        await submitButton.click();
      } else {
        // Try to find any button that looks like submit
        const buttons = await page.$$eval('button', buttons => 
          buttons.map(btn => ({ text: btn.textContent.trim(), type: btn.type }))
        );
        console.log('Available buttons:', buttons);
        
        // Click the first button (likely submit)
        await page.click('button');
      }
      
      // Wait for redirect or response
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const currentUrl = page.url();
      console.log('📍 URL after login attempt:', currentUrl);
      
      // Check if redirected to dashboard
      if (currentUrl.includes('/dashboard')) {
        console.log('✅ Redirected to dashboard');
        
        // Wait for dashboard to load
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check if dashboard is stuck loading
        const isLoading = await page.evaluate(() => {
          return document.body.textContent.includes('Loading...');
        });
        
        if (isLoading) {
          console.log('❌ Dashboard stuck on "Loading..."');
          
          // Test API calls manually
          console.log('\n🧪 Testing API calls manually...');
          
          const authTest = await page.evaluate(async () => {
            try {
              const response = await fetch('/api/auth/me', { 
                credentials: 'include' 
              });
              return {
                status: response.status,
                ok: response.ok,
                body: await response.text()
              };
            } catch (e) {
              return { error: e.message };
            }
          });
          
          console.log('🔐 Auth API test result:', authTest);
          
          const dashboardTest = await page.evaluate(async () => {
            try {
              const response = await fetch('/api/employee/dashboard', { 
                credentials: 'include' 
              });
              return {
                status: response.status,
                ok: response.ok,
                body: await response.text()
              };
            } catch (e) {
              return { error: e.message };
            }
          });
          
          console.log('📊 Dashboard API test result:', dashboardTest);
          
        } else {
          console.log('✅ Dashboard loaded successfully');
        }
        
      } else {
        console.log('❌ Login failed or redirected elsewhere');
        
        // Check for error messages
        const errorMessages = await page.evaluate(() => {
          const errors = [];
          const errorSelectors = ['.error', '.alert-error', '.text-red-500', '[class*="error"]'];
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
          console.log('❌ Login error messages:');
          errorMessages.forEach(msg => console.log(`   - ${msg}`));
        }
      }
      
    } catch (e) {
      console.log('❌ Could not fill login form:', e.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testLogin().catch(console.error); 