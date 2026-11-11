import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { getPricingPlans } from '@/lib/pricing.server';
import { QUOTE_MIN_DOGS, QUOTE_REQUEST_PATH } from '@/lib/pricing-catalog';
import CheckoutButton from './CheckoutButton';

// Prices come from Stripe; re-check them every 5 minutes.
export const revalidate = 300;

export const metadata = {
    title: 'Pricing',
    description:
        'Weekly dog waste removal plans and one-time catch-up cleanups for Colorado Springs and Falcon, Colorado. Simple monthly pricing for recurring scoop service.',
    alternates: { canonical: '/pricing' },
    openGraph: {
        title: 'Pricing | Scoopify Club',
        description:
            'Weekly dog waste removal plans and one-time catch-up cleanups for Colorado Springs and Falcon, Colorado.',
        url: '/pricing',
    },
    twitter: {
        title: 'Pricing | Scoopify Club',
        description:
            'Weekly dog waste removal plans and one-time catch-up cleanups for Colorado Springs and Falcon, Colorado.',
    },
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
            {plan.startingAt && <span className="text-accent-600 mr-1">From</span>}
            <span className="text-4xl font-bold">{formatPrice(plan.price)}</span>
            {plan.kind === 'subscription' && <span className="text-accent-600">/{plan.interval}</span>}
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
        <h1 className="text-4xl font-bold text-center mb-4">Choose Your Plan</h1>
        <p className="text-center text-accent-600 max-w-2xl mx-auto mb-12">
          Recurring weekly scoop service for Colorado Springs &amp; Falcon households, plus one-time
          catch-up cleanups when a yard needs a fresh start before the club schedule begins.
        </p>

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
          <p className="text-center text-sm text-accent-600 mt-4">
            One-time prices are starting prices; large or neglected yards may be quoted separately.
          </p>
        </div>

        <div className="card p-6 mt-16 text-center">
          <h2 className="text-2xl font-semibold mb-2">{QUOTE_MIN_DOGS}+ dogs?</h2>
          <p className="text-accent-600 mb-4">
            We&apos;ll look at your yard and send you a quote. Large yards and unusual access are quoted the same way.
          </p>
          <Link href={QUOTE_REQUEST_PATH} className="inline-block rounded-md bg-primary-600 px-6 py-3 font-semibold text-white hover:bg-primary-700">
            Request a quote
          </Link>
        </div>
      </div>
    </main>);
}
