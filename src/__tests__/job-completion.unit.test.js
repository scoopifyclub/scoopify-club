/**
 * @jest-environment node
 */
process.env.JWT_SECRET = 'job-completion-unit-secret';

const mockSendMail = jest.fn(async () => ({ messageId: 'test-message' }));
jest.mock('nodemailer', () => ({ createTransport: () => ({ sendMail: mockSendMail }) }));

const { sniffImageType, normalizePhotoType } = require('@/lib/service-photos');
const { normalizeChecklist, missingChecklistItems } = require('@/lib/job-completion');
const { allocateVisit, scooperEarningDollars } = require('@/lib/job-financials');
const { sendEmail, sendServiceCompletedEmail } = require('@/lib/unified-email-service');

describe('photo validation', () => {
  test('recognizes allowed images by their leading bytes only', () => {
    expect(sniffImageType(Buffer.from([0xff, 0xd8, 0xff, 0xe1]))).toBe('image/jpeg');
    expect(sniffImageType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe('image/png');
    expect(sniffImageType(Buffer.from('RIFF\0\0\0\0WEBPVP8 ', 'latin1'))).toBe('image/webp');
    expect(sniffImageType(Buffer.from('\0\0\0\x18ftypheic', 'latin1'))).toBe('image/heic');
    expect(sniffImageType(Buffer.from('GIF89a......'))).toBeNull();
    expect(sniffImageType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg">'))).toBeNull();
  });

  test('maps legacy photo type names onto the PhotoType enum', () => {
    expect(normalizePhotoType('pre_service')).toBe('BEFORE');
    expect(normalizePhotoType('POST_CLEAN')).toBe('AFTER');
    expect(normalizePhotoType('GATE')).toBe('OTHER');
    expect(() => normalizePhotoType('SELFIE')).toThrow('Photo type');
  });
});

describe('checklist', () => {
  test('accepts objects, arrays of names, item arrays and JSON, with aliases', () => {
    expect(missingChecklistItems(normalizeChecklist({ allWasteRemoved: true, gateClosed: true }))).toEqual([]);
    expect(missingChecklistItems(normalizeChecklist(['yardCleaned', 'gateClosedOnExit']))).toEqual([]);
    expect(missingChecklistItems(normalizeChecklist([{ id: 'allWasteRemoved', completed: true }, { id: 'gateClosed', completed: false }]))).toEqual(['gateClosed']);
    expect(missingChecklistItems(normalizeChecklist('{"allWasteRemoved":true,"gateClosed":"yes"}'))).toEqual(['gateClosed']);
    expect(missingChecklistItems(normalizeChecklist(undefined))).toEqual(['allWasteRemoved', 'gateClosed']);
  });
});

describe('visit allocation (monthly x 12 / 52, 75% to the scooper, Scoopify pays Stripe fees)', () => {
  test.each([
    [79, 1823, 1367, 60, 396],
    [89, 2054, 1541, 66, 447],
    [99, 2285, 1714, 73, 498],
  ])('$%i/month plan', (price, customer, scooper, fee, retained) => {
    expect(allocateVisit({ price, type: 'MONTHLY' })).toEqual({
      pricingBasis: 'SUBSCRIPTION_WEEKLY',
      planPriceCents: price * 100,
      customerPriceCents: customer,
      scooperEarningCents: scooper,
      referralExpenseCents: 0,
      stripeFeeCents: fee,
      retainedContributionCents: retained,
    });
  });

  test('one-time plans allocate the whole price', () => {
    expect(allocateVisit({ price: 119, type: 'ONE_TIME' })).toMatchObject({
      pricingBasis: 'ONE_TIME',
      customerPriceCents: 11900,
      scooperEarningCents: 8925,
      stripeFeeCents: 375,
      retainedContributionCents: 2600,
    });
  });

  test('components always add up, and a plan without a price has no allocation', () => {
    for (let price = 1; price <= 200; price += 0.37) {
      const a = allocateVisit({ price: Math.round(price * 100) / 100 });
      expect(a.customerPriceCents - a.scooperEarningCents - a.referralExpenseCents - a.stripeFeeCents).toBe(a.retainedContributionCents);
    }
    expect(allocateVisit({ price: 0 })).toBeNull();
    expect(allocateVisit(null)).toBeNull();
    expect(scooperEarningDollars({ price: 79 })).toBe(13.67);
  });
});

describe('completion email', () => {
  const service = {
    id: 'svc-1',
    completedDate: new Date('2026-11-10T18:00:00Z'),
    servicePlan: { name: 'Weekly Club' },
    customer: { user: { email: 'casey@example.com', firstName: 'Casey', lastName: '<b>C</b>' } },
  };
  const scooper = { user: { firstName: 'Sam', lastName: 'Scooper' } };
  const photos = [
    { type: 'BEFORE', url: 'https://bucket.s3.us-west-2.amazonaws.com/services/svc-1/before/a.jpg?X-Amz-Signature=abc&X-Amz-Expires=604800' },
    { type: 'AFTER', url: 'https://bucket.s3.us-west-2.amazonaws.com/services/svc-1/after/b.jpg?X-Amz-Signature=def&X-Amz-Expires=604800' },
  ];

  beforeEach(() => mockSendMail.mockClear());

  test('is skipped, not failed, when SMTP is not configured', async () => {
    delete process.env.SMTP_PASSWORD;
    const result = await sendServiceCompletedEmail(service, scooper, { photos });
    expect(result).toEqual({ success: false, skipped: true, reason: 'EMAIL_NOT_CONFIGURED' });
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  test('is sent to the customer with the photos and escaped names', async () => {
    process.env.SMTP_PASSWORD = 'test-password';
    try {
      const result = await sendServiceCompletedEmail(service, scooper, { photos });
      expect(result).toMatchObject({ success: true, messageId: 'test-message' });
      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const [{ to, html }] = mockSendMail.mock.calls[0];
      expect(to).toBe('casey@example.com');
      expect(html).toContain('X-Amz-Signature=def&amp;X-Amz-Expires=604800');
      expect(html).toContain('X-Amz-Signature=abc');
      expect(html).toContain('Casey &lt;b&gt;C&lt;/b&gt;');
      expect(html).toContain('Sam Scooper');
    } finally {
      delete process.env.SMTP_PASSWORD;
    }
  });

  test('sendEmail also accepts a single options object', async () => {
    process.env.SMTP_PASSWORD = 'test-password';
    try {
      await sendEmail({ to: 'x@example.com', template: 'service-reminder', data: { customerName: 'X' } });
      expect(mockSendMail.mock.calls[0][0].to).toBe('x@example.com');
    } finally {
      delete process.env.SMTP_PASSWORD;
    }
  });
});
