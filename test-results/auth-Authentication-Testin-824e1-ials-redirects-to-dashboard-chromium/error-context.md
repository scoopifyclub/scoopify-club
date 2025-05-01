# Test info

- Name: Authentication Testing >> Login with valid credentials redirects to dashboard
- Location: C:\Users\matt2\Documents\Cursor\ScoopifyClub\tests\auth.spec.js:38:3

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toHaveURL(expected)

Locator: locator(':root')
Expected pattern: /.*\/dashboard/
Received string:  "https://www.scoopify.club/auth/signin"
Call log:
  - expect.toHaveURL with timeout 5000ms
  - waiting for locator(':root')
    8 × locator resolved to <html lang="en" class="light">…</html>
      - unexpected value "https://www.scoopify.club/auth/signin"

    at C:\Users\matt2\Documents\Cursor\ScoopifyClub\tests\auth.spec.js:47:24
```

# Page snapshot

```yaml
- banner:
  - navigation:
    - link "ScoopifyClub":
      - /url: /
    - link "Home":
      - /url: /
    - link "Services":
      - /url: /services
    - link "Pricing":
      - /url: /pricing
    - link "About":
      - /url: /about
    - link "Log in":
      - /url: /login
    - link "Join the Club":
      - /url: /signup
    - link "Become a Scooper":
      - /url: /auth/scooper-signup
- main:
  - heading "Sign in to your account" [level=2]
  - paragraph:
    - text: Or
    - button "create a new account"
  - text: Email address
  - textbox "Email address": test@example.com
  - text: Password
  - textbox "Password": Test123!@#
  - button "Forgot your password?"
  - button "Sign in"
- contentinfo:
  - navigation "Footer":
    - link "Home":
      - /url: /
    - link "Services":
      - /url: /services
    - link "Pricing":
      - /url: /pricing
    - link "About":
      - /url: /about
    - link "Contact":
      - /url: /contact
  - link "Privacy":
    - /url: /privacy
  - link "Terms":
    - /url: /terms
  - paragraph: © 2025 ScoopifyClub. All rights reserved.
- region "Notifications alt+T"
- alert
```

# Test source

```ts
   1 | const { test, expect } = require('@playwright/test');
   2 |
   3 | test.describe('Authentication Testing', () => {
   4 |   test.beforeEach(async ({ page }) => {
   5 |     // Navigate to login page before each test
   6 |     await page.goto('https://www.scoopify.club/auth/signin');
   7 |   });
   8 |
   9 |   test('Login form is visible and has required fields', async ({ page }) => {
  10 |     // Check if email field exists
  11 |     await expect(page.locator('input[type="email"]')).toBeVisible();
  12 |     
  13 |     // Check if password field exists
  14 |     await expect(page.locator('input[type="password"]')).toBeVisible();
  15 |     
  16 |     // Check if login button exists
  17 |     await expect(page.locator('button[type="submit"]')).toBeVisible();
  18 |     
  19 |     // Check if "create a new account" link exists
  20 |     await expect(page.locator('text=create a new account')).toBeVisible();
  21 |     
  22 |     // Check if "Forgot your password?" link exists
  23 |     await expect(page.locator('text=Forgot your password?')).toBeVisible();
  24 |   });
  25 |
  26 |   test('Login with invalid credentials shows error', async ({ page }) => {
  27 |     // Fill in invalid credentials
  28 |     await page.fill('input[type="email"]', 'invalid@example.com');
  29 |     await page.fill('input[type="password"]', 'wrongpassword');
  30 |     
  31 |     // Click login button
  32 |     await page.click('button[type="submit"]');
  33 |     
  34 |     // Check for error message
  35 |     await expect(page.locator('text=Invalid email or password')).toBeVisible();
  36 |   });
  37 |
  38 |   test('Login with valid credentials redirects to dashboard', async ({ page }) => {
  39 |     // Fill in valid credentials
  40 |     await page.fill('input[type="email"]', 'test@example.com');
  41 |     await page.fill('input[type="password"]', 'Test123!@#');
  42 |     
  43 |     // Click login button
  44 |     await page.click('button[type="submit"]');
  45 |     
  46 |     // Check if redirected to dashboard
> 47 |     await expect(page).toHaveURL(/.*\/dashboard/);
     |                        ^ Error: Timed out 5000ms waiting for expect(locator).toHaveURL(expected)
  48 |   });
  49 |
  50 |   test('Forgot password link works', async ({ page }) => {
  51 |     // Click forgot password link
  52 |     await page.click('text=Forgot your password?');
  53 |     
  54 |     // Check if redirected to forgot password page
  55 |     await expect(page).toHaveURL(/.*\/auth\/forgot-password/);
  56 |     
  57 |     // Check if email input field exists
  58 |     await expect(page.locator('input[type="email"]')).toBeVisible();
  59 |   });
  60 |
  61 |   test('Sign up link works', async ({ page }) => {
  62 |     // Click sign up link
  63 |     await page.click('text=create a new account');
  64 |     
  65 |     // Check if redirected to signup page
  66 |     await expect(page).toHaveURL(/.*\/auth\/signup/);
  67 |     
  68 |     // Check if signup form is visible
  69 |     await expect(page.locator('form')).toBeVisible();
  70 |   });
  71 | }); 
```