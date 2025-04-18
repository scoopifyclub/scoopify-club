import { Page } from '@playwright/test';
import { testUsers } from '../src/tests/setup';

export const testData = {
  service: {
    type: 'regular',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // tomorrow
    address: '123 Test St, Test City, TS 12345',
    notes: 'Test service notes',
  },
  payment: {
    amount: 100,
    cardNumber: '4242424242424242',
    expiry: '12/25',
    cvc: '123',
  },
};

export async function loginAs(page: Page, role: 'customer' | 'employee' | 'admin') {
  const user = testUsers[role];
  await page.goto('/login');
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
}

export async function createService(page: Page, serviceData = testData.service) {
  await page.goto('/services/new');
  await page.fill('input[name="serviceType"]', serviceData.type);
  await page.fill('input[name="date"]', serviceData.date);
  await page.fill('textarea[name="address"]', serviceData.address);
  await page.fill('textarea[name="notes"]', serviceData.notes);
  await page.click('button[type="submit"]');
  await page.waitForURL('/services/*');
}

export async function makePayment(page: Page, paymentData = testData.payment) {
  await page.fill('input[name="cardNumber"]', paymentData.cardNumber);
  await page.fill('input[name="expiry"]', paymentData.expiry);
  await page.fill('input[name="cvc"]', paymentData.cvc);
  await page.click('button[type="submit"]');
  await page.waitForURL('/payments/success');
}

export async function uploadPhoto(page: Page, filePath: string) {
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.click('input[type="file"]');
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(filePath);
  await page.click('button[type="submit"]');
  await page.waitForSelector('.photo-preview');
} 