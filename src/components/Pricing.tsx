'use client'

import { Button } from '@/components/ui/button'
import { Check, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { stripePromise } from '@/lib/stripe'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const tiers = [
  {
    name: 'Single Dog',
    price: '$55',
    description: 'Weekly yard cleaning for 1 dog',
    features: [
      'Weekly service',
      '1 dog',
      'Priority scheduling',
      'Email notifications',
      'Monthly billing',
    ],
    priceId: 'price_1RDxEPQ8d6yK8uhzrmZfPvWr', // Single Dog Monthly
    cta: 'Get Started',
  },
  {
    name: 'Two Dogs',
    price: '$70',
    description: 'Weekly yard cleaning for 2 dogs',
    features: [
      'Weekly service',
      '2 dogs',
      'Priority scheduling',
      'Email notifications',
      'Monthly billing',
    ],
    priceId: 'price_1RDxEPQ8d6yK8uhzrmZfPvWr', // Two Dogs Monthly
    cta: 'Get Started',
    featured: true,
  },
  {
    name: 'Three+ Dogs',
    price: '$100',
    description: 'Weekly yard cleaning for 3 or more dogs',
    features: [
      'Weekly service',
      '3 or more dogs',
      'Priority scheduling',
      'Email notifications',
      'Monthly billing',
    ],
    priceId: 'price_1RDxEPQ8d6yK8uhzrmZfPvWr', // Three+ Dogs Monthly
    cta: 'Get Started',
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
    <div className="relative bg-gradient-to-b from-neutral-50 to-white py-24 sm:py-32">
      <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-5" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-neutral-600">
            Choose the plan that's right for you and your furry friends
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200 ${
                tier.featured ? 'ring-2 ring-brand-primary' : ''
              }`}
            >
              {tier.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 transform">
                  <span className="inline-flex rounded-full bg-brand-primary px-4 py-1 text-sm font-semibold text-white">
                    Most Popular
                  </span>
                </div>
              )}
              <div className="flex flex-col h-full">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900">{tier.name}</h3>
                  <p className="mt-4 text-sm text-neutral-600">{tier.description}</p>
                  <p className="mt-6 flex items-baseline">
                    <span className="text-4xl font-bold tracking-tight text-neutral-900">
                      {tier.price}
                    </span>
                    <span className="ml-1 text-sm text-neutral-600">/month</span>
                  </p>
                  <ul className="mt-6 space-y-4">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-center">
                        <Check className="h-5 w-5 text-brand-primary" />
                        <span className="ml-3 text-sm text-neutral-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-8">
                  <Button
                    onClick={() => handleCheckout(tier.priceId)}
                    disabled={loading === tier.priceId}
                    className={`w-full ${
                      tier.featured
                        ? 'bg-brand-primary text-white hover:bg-brand-primary-dark'
                        : 'bg-white text-brand-primary hover:bg-neutral-50'
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
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 