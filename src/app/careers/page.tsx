'use client'

import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Check, MapPin, Clock, DollarSign } from 'lucide-react'
import Link from 'next/link'

export default function CareersPage() {
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
                Join Our Team
              </h1>
              <p className="mt-6 text-lg text-neutral-600">
                Be your own boss while making neighborhoods cleaner and safer for pets
              </p>
            </div>
          </div>
        </section>

        {/* Job Details */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-neutral-900">
                Independent Contractor Position
              </h2>
              <p className="mt-4 text-lg text-neutral-600">
                Work on your own schedule and earn based on yards serviced
              </p>
            </div>
            <div className="mt-16 space-y-8">
              <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-900">Pet Waste Removal Specialist</h3>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-neutral-600">
                      <div className="flex items-center">
                        <MapPin className="mr-1.5 h-4 w-4" />
                        Multiple Locations
                      </div>
                      <div className="flex items-center">
                        <Clock className="mr-1.5 h-4 w-4" />
                        Flexible Schedule
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="mr-1.5 h-4 w-4" />
                        Per-Yard Payment
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 sm:mt-0">
                    <Button>Apply Now</Button>
                  </div>
                </div>
                <p className="mt-4 text-neutral-600">
                  Join our team of independent contractors providing weekly yard cleaning services. 
                  Set your own schedule and earn based on the number of yards you service.
                </p>
                <div className="mt-6">
                  <h4 className="font-semibold text-neutral-900">Requirements:</h4>
                  <ul className="mt-2 space-y-2">
                    {[
                      'Valid driver\'s license and reliable transportation',
                      'Ability to work outdoors in various weather conditions',
                      'Strong work ethic and attention to detail',
                      'Passion for pets and community service',
                      'Must be able to pass background check',
                      'Must be at least 18 years old',
                    ].map((req) => (
                      <li key={req} className="flex items-start">
                        <Check className="h-5 w-5 flex-shrink-0 text-brand-primary" />
                        <span className="ml-2 text-neutral-600">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-6">
                  <h4 className="font-semibold text-neutral-900">Compensation:</h4>
                  <ul className="mt-2 space-y-2">
                    {[
                      '1099 Independent Contractor position',
                      'Earn per yard serviced',
                      'Weekly direct deposit payments',
                      'Flexible scheduling - work when you want',
                      'Keep all tips from customers',
                    ].map((item) => (
                      <li key={item} className="flex items-start">
                        <Check className="h-5 w-5 flex-shrink-0 text-brand-primary" />
                        <span className="ml-2 text-neutral-600">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Join Section */}
        <section className="bg-neutral-50 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-neutral-900">
                Why Join Our Team?
              </h2>
              <p className="mt-4 text-lg text-neutral-600">
                Be your own boss while making a difference in your community
              </p>
            </div>
            <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: 'Flexible Schedule',
                  description: 'Work when you want - mornings, afternoons, or weekends',
                },
                {
                  title: 'Be Your Own Boss',
                  description: 'Set your own hours and work at your own pace',
                },
                {
                  title: 'Quick Start',
                  description: 'Start working within days of approval',
                },
                {
                  title: 'Simple Process',
                  description: 'Easy-to-use app for managing your routes and payments',
                },
                {
                  title: 'Keep All Tips',
                  description: '100% of customer tips go directly to you',
                },
                {
                  title: 'Weekly Pay',
                  description: 'Get paid weekly via direct deposit',
                },
              ].map((value) => (
                <div
                  key={value.title}
                  className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200"
                >
                  <h3 className="text-lg font-semibold text-neutral-900">{value.title}</h3>
                  <p className="mt-4 text-neutral-600">{value.description}</p>
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
                  Ready to Be Your Own Boss?
                </h2>
                <p className="mt-4 text-lg text-white/90">
                  Apply today and start earning on your own schedule
                </p>
                <div className="mt-8">
                  <Button
                    size="lg"
                    className="bg-white text-brand-primary hover:bg-white/90"
                  >
                    Apply Now
                  </Button>
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