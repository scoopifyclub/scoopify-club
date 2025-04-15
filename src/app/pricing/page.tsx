'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { stripePromise } from '@/lib/stripe';

const plans = [
  {
    name: 'Single Dog',
    price: 55.00,
    interval: 'month',
    serviceFrequency: 'Weekly',
    numberOfDogs: 1,
    priceId: 'price_1RDxEPQ8d6yK8uhzrmZfPvWr',
    features: [
      'Weekly yard cleaning',
      '1 dog',
      'Priority scheduling',
      'Email notifications',
      'Monthly billing',
    ],
    popular: false,
  },
  {
    name: 'Two Dogs',
    price: 70.00,
    interval: 'month',
    serviceFrequency: 'Weekly',
    numberOfDogs: 2,
    priceId: 'price_1RDxEPQ8d6yK8uhzrmZfPvWr',
    features: [
      'Weekly yard cleaning',
      '2 dogs',
      'Priority scheduling',
      'Email notifications',
      'Monthly billing',
    ],
    popular: true,
  },
  {
    name: 'Three+ Dogs',
    price: 100.00,
    interval: 'month',
    serviceFrequency: 'Weekly',
    numberOfDogs: '3+',
    priceId: 'price_1RDxEPQ8d6yK8uhzrmZfPvWr',
    features: [
      'Weekly yard cleaning',
      '3 or more dogs',
      'Priority scheduling',
      'Email notifications',
      'Monthly billing',
    ],
    popular: false,
  },
  {
    name: 'One-Time Cleanup (1 Dog)',
    price: 75.00,
    interval: 'one-time',
    serviceFrequency: 'Single Visit',
    numberOfDogs: 1,
    priceId: 'price_1RDxERQ8d6yK8uhzdukcSTxA',
    features: [
      'Single yard cleaning',
      '1 dog',
      'Flexible scheduling',
      'Email confirmation',
      'No subscription required',
    ],
    popular: false,
  },
  {
    name: 'One-Time Cleanup (2 Dogs)',
    price: 90.00,
    interval: 'one-time',
    serviceFrequency: 'Single Visit',
    numberOfDogs: 2,
    priceId: 'price_1RDxERQ8d6yK8uhzuQm3XxVE',
    features: [
      'Single yard cleaning',
      '2 dogs',
      'Flexible scheduling',
      'Email confirmation',
      'No subscription required',
    ],
    popular: false,
  },
  {
    name: 'One-Time Cleanup (3+ Dogs)',
    price: 120.00,
    interval: 'one-time',
    serviceFrequency: 'Single Visit',
    numberOfDogs: '3+',
    priceId: 'price_1RDxERQ8d6yK8uhzZu0OItnc',
    features: [
      'Single yard cleaning',
      '3 or more dogs',
      'Flexible scheduling',
      'Email confirmation',
      'No subscription required',
    ],
    popular: false,
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async (priceId: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          priceId,
          isOneTime: priceId.includes('one-time') // Simple check for one-time vs subscription
        }),
      });

      const { sessionId } = await response.json();
      const stripe = await stripePromise;
      
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId });
        if (error) {
          console.error('Stripe checkout error:', error);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-12">Choose Your Plan</h1>
        
        {/* Monthly Plans */}
        <div className="mb-16">
          <h2 className="text-2xl font-semibold text-center mb-8">Monthly Subscription Plans</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {plans.slice(0, 3).map((plan) => (
              <div 
                key={plan.name} 
                className={`card p-6 relative ${plan.popular ? 'border-2 border-primary-600' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-primary-600 text-white px-3 py-1 rounded-tl-lg">
                    Most Popular
                  </div>
                )}
                <h2 className="text-2xl font-semibold mb-4">{plan.name}</h2>
                <div className="mb-2">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-accent-600">/{plan.interval}</span>
                </div>
                <div className="text-sm text-accent-600 mb-6">
                  {plan.serviceFrequency} service • {plan.numberOfDogs} {typeof plan.numberOfDogs === 'number' ? 'dog' + (plan.numberOfDogs > 1 ? 's' : '') : 'dogs'}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center">
                      <CheckCircle2 className="h-5 w-5 text-primary-600 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full ${plan.popular ? 'bg-primary-600 hover:bg-primary-700' : ''}`}
                  onClick={() => handleCheckout(plan.priceId)}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Get Started'}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* One-Time Cleanup Plans */}
        <div>
          <h2 className="text-2xl font-semibold text-center mb-8">One-Time Cleanup</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {plans.slice(3).map((plan) => (
              <div 
                key={plan.name} 
                className="card p-6 relative"
              >
                <h2 className="text-2xl font-semibold mb-4">{plan.name}</h2>
                <div className="mb-2">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-accent-600">/{plan.interval}</span>
                </div>
                <div className="text-sm text-accent-600 mb-6">
                  {plan.serviceFrequency} • {plan.numberOfDogs} {typeof plan.numberOfDogs === 'number' ? 'dog' + (plan.numberOfDogs > 1 ? 's' : '') : 'dogs'}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center">
                      <CheckCircle2 className="h-5 w-5 text-primary-600 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  onClick={() => handleCheckout(plan.priceId)}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Schedule Cleanup'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
} 