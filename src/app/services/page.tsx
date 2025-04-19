'use client'

import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <main>
        {/* Hero Section */}
        <section className="relative py-16 sm:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Our Services
              </h1>
              <p className="mt-6 text-xl text-neutral-600">
                Professional dog waste removal services tailored to your needs
              </p>
            </div>
          </div>
        </section>

        {/* Service Details */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 items-center">
              <div className="space-y-8">
                <h2 className="text-3xl font-bold tracking-tight">
                  Weekly Yard Cleaning
                </h2>
                <p className="text-lg text-neutral-600">
                  Our professional team will visit your property weekly to remove all dog waste,
                  ensuring a clean and safe environment for your family and pets.
                </p>
                <ul className="space-y-4">
                  {[
                    'Regular weekly service',
                    'Thorough yard inspection',
                    'Complete waste removal',
                    'Disposal in eco-friendly bags',
                    'Email notifications after service',
                  ].map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-brand-primary/10 rounded-full flex items-center justify-center">
                        <Check className="h-4 w-4 text-brand-primary" />
                      </div>
                      <span className="text-base text-neutral-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="pt-4">
                  <Link href="/pricing">
                    <Button className="btn btn-primary">
                      View Pricing
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="/images/service-demo.jpg"
                  alt="Professional dog waste removal service"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Service Benefits */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4">
                Why Choose Our Service?
              </h2>
              <p className="text-xl text-neutral-600">
                We provide more than just waste removal - we offer peace of mind
              </p>
            </div>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: 'Professional Team',
                  description:
                    'Our trained professionals handle waste removal with care and efficiency.',
                },
                {
                  title: 'Reliable Service',
                  description:
                    'Consistent weekly visits ensure your yard stays clean and safe.',
                },
                {
                  title: 'Eco-Friendly',
                  description:
                    'We use biodegradable bags and follow environmentally responsible practices.',
                },
                {
                  title: 'Easy Scheduling',
                  description:
                    'Flexible scheduling options to fit your needs and preferences.',
                },
                {
                  title: 'Peace of Mind',
                  description:
                    'No more worrying about cleaning up after your pets - we handle it all.',
                },
                {
                  title: 'Customer Support',
                  description:
                    'Dedicated support team available to address any questions or concerns.',
                },
              ].map((benefit) => (
                <div
                  key={benefit.title}
                  className="card group"
                >
                  <h3 className="text-lg font-semibold mb-3">{benefit.title}</h3>
                  <p className="text-neutral-600">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="rounded-2xl bg-gradient-to-br from-brand-primary to-brand-primary-dark px-6 py-16 sm:p-16">
              <div className="max-w-2xl mx-auto text-center text-white">
                <h2 className="text-3xl font-bold tracking-tight mb-4">
                  Ready to Get Started?
                </h2>
                <p className="text-xl text-white/90 mb-8">
                  Join hundreds of satisfied customers who trust us with their pet waste removal needs.
                </p>
                <div>
                  <Link href="/pricing">
                    <Button
                      className="bg-white text-brand-primary hover:bg-white/90 text-lg"
                    >
                      View Pricing Plans
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
} 