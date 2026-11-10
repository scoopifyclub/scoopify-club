import { CheckCircle2 } from 'lucide-react';
import { getPricingPlans } from '@/lib/pricing.server';
import CheckoutButton from './CheckoutButton';

// Prices come from Stripe; re-check them every 5 minutes.
export const revalidate = 300;

export const metadata = {
    title: 'Pricing | Scoopify Club',
    description: 'Weekly dog waste removal plans and one-time cleanups.',
};

function formatPrice(amount) {
    return Number.isInteger(amount) ? `$${amount}` : `$${amount.toFixed(2)}`;
}

function dogsLabel(numberOfDogs) {
    if (typeof numberOfDogs === 'number') return `${numberOfDogs} dog${numberOfDogs > 1 ? 's' : ''}`;
    return `${numberOfDogs} dogs`;
}

function PlanCard({ plan, ctaLabel, frequencyLabel }) {
    const purchasable = plan.available && plan.price != null;
    return (<div className={`card p-6 relative ${plan.popular ? 'border-2 border-primary-600' : ''}`}>
      {plan.popular && (<div className="absolute top-0 right-0 bg-primary-600 text-white px-3 py-1 rounded-tl-lg">
          Most Popular
        </div>)}
      <h2 className="text-2xl font-semibold mb-4">{plan.name}</h2>
      <div className="mb-2">
        {plan.price != null ? (<>
            <span className="text-4xl font-bold">{formatPrice(plan.price)}</span>
            <span className="text-accent-600">/{plan.interval}</span>
          </>) : (<span className="text-2xl font-semibold text-accent-600">Pricing coming soon</span>)}
      </div>
      <div className="text-sm text-accent-600 mb-6">
        {frequencyLabel} • {dogsLabel(plan.numberOfDogs)}
      </div>
      <ul className="space-y-3 mb-8">
        {plan.features.map((feature) => (<li key={feature} className="flex items-center">
            <CheckCircle2 className="h-5 w-5 text-primary-600 mr-2"/>
            {feature}
          </li>))}
      </ul>
      <CheckoutButton planId={plan.id} disabled={!purchasable} className={`w-full ${plan.popular ? 'bg-primary-600 hover:bg-primary-700' : ''}`}>
        {purchasable ? ctaLabel : 'Not available yet'}
      </CheckoutButton>
    </div>);
}

export default async function PricingPage() {
    const plans = await getPricingPlans();
    const monthlyPlans = plans.filter((plan) => plan.kind === 'subscription');
    const oneTimePlans = plans.filter((plan) => plan.kind === 'one_time');

    return (<main className="min-h-screen py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-12">Choose Your Plan</h1>

        <div className="mb-16">
          <h2 className="text-2xl font-semibold text-center mb-8">Monthly Subscription Plans</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {monthlyPlans.map((plan) => (<PlanCard key={plan.id} plan={plan} ctaLabel="Get Started" frequencyLabel="Weekly service"/>))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-center mb-8">One-Time Cleanup</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {oneTimePlans.map((plan) => (<PlanCard key={plan.id} plan={plan} ctaLabel="Schedule Cleanup" frequencyLabel="Single visit"/>))}
          </div>
        </div>
      </div>
    </main>);
}
