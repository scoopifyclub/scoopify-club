/**
 * @jest-environment jsdom
 */
jest.mock('@stripe/stripe-js', () => ({ loadStripe: jest.fn(async () => ({ redirectToCheckout: jest.fn() })) }));

describe('stripe-client in the browser', () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    jest.resetModules();
  });

  it('imports without STRIPE_SECRET_KEY and loads Stripe.js with the publishable key', async () => {
    delete process.env.STRIPE_SECRET_KEY;
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_123';
    const { getStripe } = require('@/lib/stripe-client');
    const { loadStripe } = require('@stripe/stripe-js');
    expect(await getStripe()).toBeTruthy();
    await getStripe();
    expect(loadStripe).toHaveBeenCalledTimes(1);
    expect(loadStripe).toHaveBeenCalledWith('pk_test_123');
  });

  it('resolves to null instead of throwing when the publishable key is missing', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const { getStripe } = require('@/lib/stripe-client');
    await expect(getStripe()).resolves.toBeNull();
  });
});
