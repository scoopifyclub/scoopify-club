'use client'

import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import Link from 'next/link'

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <Navbar />
      <main>
        {/* Hero Section */}
        <section className="relative py-20 sm:py-32">
          <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-5" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
                Our Services
              </h1>
              <p className="mt-6 text-lg text-neutral-600">
                Professional dog waste removal services tailored to your needs
              </p>
            </div>
          </div>
        </section>

        {/* Service Details */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-neutral-900">
                  Weekly Yard Cleaning
                </h2>
                <p className="mt-4 text-lg text-neutral-600">
                  Our professional team will visit your property weekly to remove all dog waste,
                  ensuring a clean and safe environment for your family and pets.
                </p>
                <ul className="mt-8 space-y-4">
                  {[
                    'Regular weekly service',
                    'Thorough yard inspection',
                    'Complete waste removal',
                    'Disposal in eco-friendly bags',
                    'Email notifications after service',
                  ].map((feature) => (
                    <li key={feature} className="flex items-start">
                      <Check className="h-6 w-6 flex-shrink-0 text-brand-primary" />
                      <span className="ml-3 text-base text-neutral-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <div className="aspect-w-16 aspect-h-9 overflow-hidden rounded-2xl bg-neutral-100">
                  <img
                    src="/images/service-demo.jpg"
                    alt="Professional dog waste removal service"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Service Benefits */}
        <section className="bg-neutral-50 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-neutral-900">
                Why Choose Our Service?
              </h2>
              <p className="mt-4 text-lg text-neutral-600">
                We provide more than just waste removal - we offer peace of mind
              </p>
            </div>
            <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
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
                  className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200"
                >
                  <h3 className="text-lg font-semibold text-neutral-900">{benefit.title}</h3>
                  <p className="mt-4 text-neutral-600">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl bg-brand-primary px-6 py-16 sm:p-16">
              <div className="mx-auto max-w-2xl text-center">
                <h2 className="text-3xl font-bold tracking-tight text-white">
                  Ready to Get Started?
                </h2>
                <p className="mt-4 text-lg text-white/90">
                  Join hundreds of satisfied customers who trust us with their pet waste removal needs.
                </p>
                <div className="mt-8">
                  <Link href="/pricing">
                    <Button
                      size="lg"
                      className="bg-white text-brand-primary hover:bg-white/90"
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
      <Footer />
    </div>
  )
} 