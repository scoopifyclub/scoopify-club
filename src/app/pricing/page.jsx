'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { stripePromise } from '@/lib/stripe';
// Default plans structure - used only for typescript types and initial loading state
const defaultPlans = [
    {
        name: 'Single Dog',
        price: 55.00,
        interval: 'month',
        serviceFrequency: 'Weekly',
        numberOfDogs: 1,
        priceId: '',
        features: [
            'Weekly yard cleaning',
            '1 dog',
            'Priority scheduling',
            'Email notifications',
            'Photo verification',
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
        priceId: '',
        features: [
            'Weekly yard cleaning',
            '2 dogs',
            'Priority scheduling',
            'Email notifications',
            'Photo verification',
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
        priceId: '',
        features: [
            'Weekly yard cleaning',
            '3 or more dogs',
            'Priority scheduling',
            'Email notifications',
            'Photo verification',
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
        priceId: '',
        features: [
            'Single yard cleaning',
            '1 dog',
            'Choose your preferred day',
            'Email confirmation',
            'Photo verification',
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
        priceId: '',
        features: [
            'Single yard cleaning',
            '2 dogs',
            'Choose your preferred day',
            'Email confirmation',
            'Photo verification',
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
        priceId: '',
        features: [
            'Single yard cleaning',
            '3 or more dogs',
            'Choose your preferred day',
            'Email confirmation',
            'Photo verification',
            'No subscription required',
        ],
        popular: false,
    },
];
export default function PricingPage() {
    const [loading, setLoading] = useState(false);
    const [plans, setPlans] = useState(defaultPlans);
    const [isLoadingPlans, setIsLoadingPlans] = useState(true);
    const [loadError, setLoadError] = useState('');
    useEffect(() => {
        const fetchPrices = async () => {
            try {
                setIsLoadingPlans(true);
                const response = await fetch('/api/prices');
                if (!response.ok) {
                    throw new Error(`Error fetching prices: ${response.status}`);
                }
                const data = await response.json();
                // Verify we have valid price IDs before setting plans
                const validPlans = data.plans && data.plans.every((plan) => plan.priceId);
                if (validPlans) {
                    setPlans(data.plans);
                }
                else {
                    throw new Error('Missing price IDs from Stripe');
                }
            }
            catch (error) {
                console.error('Error fetching prices:', error);
                setLoadError('Unable to load pricing. Please try again later.');
            }
            finally {
                setIsLoadingPlans(false);
            }
        };
        fetchPrices();
    }, []);
    const handleCheckout = async (priceId, isOneTime) => {
        if (!priceId) {
            console.error('No price ID available');
            return;
        }
        // Check if we're using a placeholder price ID
        if (priceId.includes('price_placeholder')) {
            alert('This is using placeholder pricing because Stripe is not fully configured yet. Please set up your Stripe account and add real products with the correct metadata.');
            return;
        }
        try {
            setLoading(true);
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    priceId,
                    isOneTime
                }),
            });
            if (!response.ok) {
                throw new Error('Failed to create checkout session');
            }
            const { sessionId } = await response.json();
            const stripe = await stripePromise;
            if (stripe) {
                const { error } = await stripe.redirectToCheckout({ sessionId });
                if (error) {
                    console.error('Stripe checkout error:', error);
                    throw new Error(error.message);
                }
            }
        }
        catch (error) {
            console.error('Error:', error);
            alert('Something went wrong with the checkout process. Please try again.');
        }
        finally {
            setLoading(false);
        }
    };
    if (isLoadingPlans) {
        return (<main className="min-h-screen py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-8">Loading Plans...</h1>
          <div className="animate-pulse flex flex-col items-center space-y-8">
            <div className="h-8 w-64 bg-gray-300 rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
              {[...Array(3)].map((_, i) => (<div key={i} className="bg-gray-100 h-96 rounded-lg p-6">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-6"></div>
                  <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
                  <div className="space-y-3">
                    {[...Array(5)].map((_, j) => (<div key={j} className="h-4 bg-gray-300 rounded"></div>))}
                  </div>
                </div>))}
            </div>
          </div>
        </div>
      </main>);
    }
    if (loadError) {
        return (<main className="min-h-screen py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-8">Unable to Load Pricing</h1>
          <p className="text-xl mb-8">{loadError}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </main>);
    }
    return (<main className="min-h-screen py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-12">Choose Your Plan</h1>
        
        {/* Monthly Plans */}
        <div className="mb-16">
          <h2 className="text-2xl font-semibold text-center mb-8">Monthly Subscription Plans</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {plans.slice(0, 3).map((plan) => (<div key={plan.name} className={`card p-6 relative ${plan.popular ? 'border-2 border-primary-600' : ''}`}>
                {plan.popular && (<div className="absolute top-0 right-0 bg-primary-600 text-white px-3 py-1 rounded-tl-lg">
                    Most Popular
                  </div>)}
                <h2 className="text-2xl font-semibold mb-4">{plan.name}</h2>
                <div className="mb-2">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-accent-600">/{plan.interval}</span>
                </div>
                <div className="text-sm text-accent-600 mb-6">
                  {plan.serviceFrequency} service • {plan.numberOfDogs} {typeof plan.numberOfDogs === 'number' ? 'dog' + (plan.numberOfDogs > 1 ? 's' : '') : 'dogs'}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (<li key={feature} className="flex items-center">
                      <CheckCircle2 className="h-5 w-5 text-primary-600 mr-2"/>
                      {feature}
                    </li>))}
                </ul>
                <Button className={`w-full ${plan.popular ? 'bg-primary-600 hover:bg-primary-700' : ''}`} onClick={() => handleCheckout(plan.priceId, false)} disabled={loading || !plan.priceId}>
                  {loading ? 'Processing...' : 'Get Started'}
                </Button>
              </div>))}
          </div>
        </div>

        {/* One-Time Cleanup Plans */}
        <div>
          <h2 className="text-2xl font-semibold text-center mb-8">One-Time Cleanup</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {plans.slice(3).map((plan) => (<div key={plan.name} className="card p-6 relative">
                <h2 className="text-2xl font-semibold mb-4">{plan.name}</h2>
                <div className="mb-2">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-accent-600">/{plan.interval}</span>
                </div>
                <div className="text-sm text-accent-600 mb-6">
                  {plan.serviceFrequency} • {plan.numberOfDogs} {typeof plan.numberOfDogs === 'number' ? 'dog' + (plan.numberOfDogs > 1 ? 's' : '') : 'dogs'}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (<li key={feature} className="flex items-center">
                      <CheckCircle2 className="h-5 w-5 text-primary-600 mr-2"/>
                      {feature}
                    </li>))}
                </ul>
                <Button className="w-full" onClick={() => handleCheckout(plan.priceId, true)} disabled={loading || !plan.priceId}>
                  {loading ? 'Processing...' : 'Schedule Cleanup'}
                </Button>
              </div>))}
          </div>
        </div>
      </div>
    </main>);
}
