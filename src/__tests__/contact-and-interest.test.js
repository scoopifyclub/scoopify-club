/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

jest.mock('@/lib/email-service', () => ({ sendEmail: jest.fn(async () => ({ success: true })) }));
jest.mock('@/lib/prisma', () => ({
  prisma: { uncoveredInterest: { create: jest.fn(async ({ data }) => ({ id: 'lead-1', ...data })) } },
}));

import { sendEmail } from '@/lib/email-service';
import { prisma } from '@/lib/prisma';
import { POST as contactPost } from '@/app/api/contact/route';
import { POST as interestPost } from '@/app/api/customer/interest/route';

const post = (path, body) =>
  new NextRequest(`http://localhost${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.ADMIN_EMAIL;
});

describe('POST /api/contact', () => {
  it('sends an escaped admin email using the (to, template, data) signature', async () => {
    const res = await contactPost(post('/api/contact', {
      name: '<script>x</script>',
      email: 'pat@example.com',
      subject: 'Quote',
      message: 'Hi <b>there</b>',
    }));
    expect(res.status).toBe(200);
    const [to, template, data] = sendEmail.mock.calls[0];
    expect(to).toBe('services@scoopify.club');
    expect(template).toBe('custom');
    expect(data.replyTo).toBe('pat@example.com');
    expect(data.html).toContain('&lt;script&gt;x&lt;/script&gt;');
    expect(data.html).toContain('Hi &lt;b&gt;there&lt;/b&gt;');
    expect(data.html).not.toContain('<script>');
    const confirmation = sendEmail.mock.calls[1];
    expect(confirmation[0]).toBe('pat@example.com');
    expect(confirmation[2].html).not.toContain('there');
  });

  it('rejects missing fields and bad emails', async () => {
    expect((await contactPost(post('/api/contact', { name: 'A', email: 'a@b.co' }))).status).toBe(400);
    expect((await contactPost(post('/api/contact', { name: 'A', email: 'nope', message: 'm' }))).status).toBe(400);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('still succeeds when only the confirmation email fails', async () => {
    sendEmail.mockResolvedValueOnce({ success: true }).mockRejectedValueOnce(new Error('smtp'));
    const res = await contactPost(post('/api/contact', { name: 'A', email: 'a@b.co', message: 'm' }));
    expect(res.status).toBe(200);
  });

  it('returns 500 when the admin email fails', async () => {
    sendEmail.mockRejectedValueOnce(new Error('smtp'));
    const res = await contactPost(post('/api/contact', { name: 'A', email: 'a@b.co', message: 'm' }));
    expect(res.status).toBe(500);
  });
});

describe('POST /api/customer/interest', () => {
  it('saves the lead and notifies the admin', async () => {
    const res = await interestPost(post('/api/customer/interest', { email: 'Lee@Example.com', name: '<i>Lee</i>', zipCode: '80903' }));
    expect(res.status).toBe(200);
    expect(prisma.uncoveredInterest.create).toHaveBeenCalledWith({
      data: { email: 'lee@example.com', name: '<i>Lee</i>', zipCode: '80903' },
    });
    const [to, template, data] = sendEmail.mock.calls[0];
    expect(to).toBe('services@scoopify.club');
    expect(template).toBe('custom');
    expect(data.html).toContain('&lt;i&gt;Lee&lt;/i&gt;');
  });

  it('rejects invalid input without saving', async () => {
    const res = await interestPost(post('/api/customer/interest', { email: 'lee@example.com', zipCode: 'abc' }));
    expect(res.status).toBe(400);
    expect(prisma.uncoveredInterest.create).not.toHaveBeenCalled();
  });

  it('returns 500 when the lead cannot be saved', async () => {
    prisma.uncoveredInterest.create.mockRejectedValueOnce(new Error('db down'));
    const res = await interestPost(post('/api/customer/interest', { email: 'lee@example.com', zipCode: '80903' }));
    expect(res.status).toBe(500);
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
