import { jest } from '@jest/globals';
// Mock Stripe products and prices
const mockProducts = [
    {
        id: 'prod_test1',
        name: 'Weekly Service',
        description: 'Weekly cleaning service',
        active: true,
    },
    {
        id: 'prod_test2',
        name: 'Bi-Weekly Service',
        description: 'Bi-weekly cleaning service',
        active: true,
    }
];
const mockPrices = [
    {
        id: 'price_test1',
        product: 'prod_test1',
        unit_amount: 10000,
        currency: 'usd',
        recurring: {
            interval: 'week',
        },
    },
    {
        id: 'price_test2',
        product: 'prod_test2',
        unit_amount: 15000,
        currency: 'usd',
        recurring: {
            interval: 'week',
        },
    }
];
// Mock Stripe class
export const mockStripe = {
    products: {
        list: jest.fn().mockResolvedValue({ data: mockProducts }),
    },
    prices: {
        list: jest.fn().mockResolvedValue({ data: mockPrices }),
    },
    customers: {
        create: jest.fn().mockResolvedValue({ id: 'cus_test123' }),
    },
    subscriptions: {
        create: jest.fn().mockResolvedValue({ id: 'sub_test123' }),
    },
    paymentMethods: {
        attach: jest.fn().mockResolvedValue({ id: 'pm_test123' }),
    },
};
// Mock the stripe module
jest.mock('stripe', () => {
    return jest.fn().mockImplementation(() => mockStripe);
});
