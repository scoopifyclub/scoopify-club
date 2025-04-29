import { stripe } from './stripe';
export async function getSubscriptionPlans() {
    try {
        const prices = await stripe.prices.list({
            active: true,
            type: 'recurring',
            expand: ['data.product']
        });
        return prices.data.map(price => ({
            id: price.id,
            name: price.product.name,
            price: price.unit_amount ? price.unit_amount / 100 : 0,
            stripePriceId: price.id
        }));
    }
    catch (error) {
        console.error('Error fetching subscription plans:', error);
        return [];
    }
}
export async function getOneTimeServices() {
    try {
        const prices = await stripe.prices.list({
            active: true,
            type: 'one_time',
            expand: ['data.product']
        });
        return prices.data.map(price => ({
            id: price.id,
            name: price.product.name,
            price: price.unit_amount ? price.unit_amount / 100 : 0,
            stripePriceId: price.id
        }));
    }
    catch (error) {
        console.error('Error fetching one-time services:', error);
        return [];
    }
}
export const SUBSCRIPTION_PLANS = {
    '1-dog': {
        price: 55,
        name: 'Single Dog Monthly',
        stripePriceId: 'price_1RDxEPQ8d6yK8uhzrmZfPvWr'
    },
    '2-dog': {
        price: 70,
        name: 'Two Dogs Monthly',
        stripePriceId: 'price_1RDxEQQ8d6yK8uhzfZSPpH78'
    },
    '3-plus': {
        price: 100,
        name: 'Three+ Dogs Monthly',
        stripePriceId: 'price_1RDxEQQ8d6yK8uhzZudAc4tu'
    }
};
export const ONE_TIME_SERVICES = {
    '1-dog': {
        price: 75,
        name: 'One-Time Cleanup (1 Dog)',
        stripePriceId: 'price_1RDxERQ8d6yK8uhzdukcSTxA'
    },
    '2-dog': {
        price: 90,
        name: 'One-Time Cleanup (2 Dogs)',
        stripePriceId: 'price_1RDxERQ8d6yK8uhzuQm3XxVE'
    },
    '3-plus': {
        price: 120,
        name: 'One-Time Cleanup (3+ Dogs)',
        stripePriceId: 'price_1RDxERQ8d6yK8uhzZu0OItnc'
    }
};
export const SERVICE_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
