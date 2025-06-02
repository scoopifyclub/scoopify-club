const puppeteer = require('puppeteer');

async function inspectForm() {
  console.log('🔍 Inspecting scooper signup form...');
  
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    await page.goto('https://scoopify.club/auth/scooper-signup', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('✅ Page loaded');
    
    // Get all input field names and IDs
    const formFields = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      return inputs.map(input => ({
        name: input.name,
        id: input.id,
        type: input.type,
        placeholder: input.placeholder,
        tagName: input.tagName
      }));
    });
    
    console.log('\n📋 Form fields found:');
    formFields.forEach((field, index) => {
      console.log(`${index + 1}. Name: "${field.name}", ID: "${field.id}", Type: ${field.type}, Placeholder: "${field.placeholder}"`);
    });
    
    // Get button information
    const buttons = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.map(btn => ({
        text: btn.textContent.trim(),
        type: btn.type,
        id: btn.id,
        className: btn.className
      }));
    });
    
    console.log('\n🔘 Buttons found:');
    buttons.forEach((btn, index) => {
      console.log(`${index + 1}. Text: "${btn.text}", Type: ${btn.type}, ID: "${btn.id}"`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

inspectForm().catch(console.error); 