'use client'

import { Button } from '@/components/ui/button'
import { Check, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { stripePromise } from '@/lib/stripe'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const tiers = [
  {
    name: 'Basic',
    description: 'Perfect for small yards',
    price: '$29',
    priceId: 'price_basic',
    features: [
      'Weekly service',
      'Up to 1,000 sq ft',
      'Basic waste removal',
      'Email support',
    ],
    cta: 'Get Started',
    featured: false,
  },
  {
    name: 'Pro',
    description: 'Ideal for medium-sized yards',
    price: '$49',
    priceId: 'price_pro',
    features: [
      'Weekly service',
      'Up to 2,500 sq ft',
      'Premium waste removal',
      'Priority support',
      'Monthly deep clean',
    ],
    cta: 'Get Started',
    featured: true,
  },
  {
    name: 'Enterprise',
    description: 'For large properties',
    price: '$99',
    priceId: 'price_enterprise',
    features: [
      'Weekly service',
      'Up to 5,000 sq ft',
      'Premium waste removal',
      '24/7 support',
      'Weekly deep clean',
      'Custom scheduling',
    ],
    cta: 'Get Started',
    featured: false,
  },
]

export function Pricing() {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  const handleCheckout = async (priceId: string) => {
    try {
      setLoading(priceId)
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          priceId,
          isOneTime: false
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { sessionId } = await response.json()
      const stripe = await stripePromise
      
      if (!stripe) {
        throw new Error('Stripe failed to initialize')
      }

      const { error } = await stripe.redirectToCheckout({ sessionId })
      if (error) {
        throw error
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to process checkout. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="bg-neutral-50 py-24 sm:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg leading-8 text-neutral-600">
            Choose the perfect plan for your yard. No hidden fees, cancel anytime.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`flex flex-col justify-between rounded-2xl bg-white p-8 shadow-shopify ring-1 ring-neutral-200 ${
                tier.featured ? 'ring-2 ring-primary-500' : ''
              }`}
            >
              <div>
                <h3 className="text-lg font-semibold leading-8 text-neutral-900">
                  {tier.name}
                </h3>
                <p className="mt-4 text-sm leading-6 text-neutral-600">
                  {tier.description}
                </p>
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-bold tracking-tight text-neutral-900">
                    {tier.price}
                  </span>
                  <span className="text-sm font-semibold leading-6 text-neutral-600">
                    /month
                  </span>
                </p>
                <ul className="mt-8 space-y-3 text-sm leading-6 text-neutral-600">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex gap-x-3">
                      <Check className="h-5 w-5 flex-none text-primary-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <Button
                onClick={() => handleCheckout(tier.priceId)}
                disabled={loading === tier.priceId}
                className={`mt-8 w-full ${
                  tier.featured
                    ? 'bg-primary-500 text-white hover:bg-primary-600'
                    : 'bg-white text-primary-500 hover:bg-neutral-50'
                }`}
              >
                {loading === tier.priceId ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  tier.cta
                )}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 