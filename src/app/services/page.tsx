'use client'

import { Button } from '@/components/ui/button'
import { Calendar, Camera, Check, CreditCard, Mail, RefreshCw } from 'lucide-react'
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
                Professional dog waste removal with weekly service, photo verification, and hassle-free billing
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl font-bold tracking-tight mb-4">
                How Our Subscription Works
              </h2>
              <p className="text-lg text-neutral-600">
                Simple, convenient, and reliable service every week
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="bg-neutral-50 rounded-xl p-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Choose Your Day</h3>
                <p className="text-neutral-600">Select your preferred service day of the week for consistent cleaning</p>
              </div>
              
              <div className="bg-neutral-50 rounded-xl p-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Monthly Billing</h3>
                <p className="text-neutral-600">Pay once monthly for all weekly services with no hidden fees</p>
              </div>
              
              <div className="bg-neutral-50 rounded-xl p-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RefreshCw className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Weekly Service</h3>
                <p className="text-neutral-600">Enjoy regular weekly cleanings without having to remember to schedule</p>
              </div>
            </div>
          </div>
        </section>

        {/* Service Details */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 items-center">
              <div className="space-y-8">
                <h2 className="text-3xl font-bold tracking-tight">
                  Premium Dog Waste Removal
                </h2>
                <p className="text-lg text-neutral-600">
                  Subscribe to our weekly service and never worry about dog waste cleanup again. We visit your property on your chosen day each week, removing all waste and providing verification of service.
                </p>
                <ul className="space-y-4">
                  {[
                    'Consistent weekly service on your chosen day',
                    'Complete property inspection and thorough cleanup',
                    'Photo verification of completed service',
                    'Email confirmation after each visit',
                    'Environmentally responsible waste disposal',
                    'Simple monthly billing for all services',
                    'No contracts - pause or cancel anytime',
                  ].map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-base text-neutral-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="pt-4">
                  <Link href="/pricing">
                    <Button className="btn btn-primary">
                      View Subscription Plans
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="/dog-hero.jpg"
                  alt="Professional dog waste removal service"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Service Verification */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl font-bold tracking-tight mb-4">
                Service Verification &amp; Communication
              </h2>
              <p className="text-lg text-neutral-600">
                We provide proof of service and keep you informed every step of the way
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="bg-neutral-50 rounded-xl p-8">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mr-4">
                    <Camera className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Photo Verification</h3>
                </div>
                <p className="text-neutral-600">
                  After each service, our technicians take photos of your cleaned yard. These photos are securely stored in your account dashboard and provide visual confirmation that the job was completed thoroughly.
                </p>
              </div>
              
              <div className="bg-neutral-50 rounded-xl p-8">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mr-4">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Email Confirmations</h3>
                </div>
                <p className="text-neutral-600">
                  Receive automatic email notifications before and after each service. Pre-service emails remind you of upcoming visits, while post-service emails confirm completion and include any notes from our technicians.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="rounded-2xl bg-gradient-to-br from-primary to-primary-dark px-6 py-16 sm:p-16">
              <div className="max-w-2xl mx-auto text-center text-white">
                <h2 className="text-3xl font-bold tracking-tight mb-4">
                  Ready for Hassle-Free Waste Removal?
                </h2>
                <p className="text-xl text-white/90 mb-8">
                  Join hundreds of satisfied customers who enjoy our weekly subscription service for a cleaner, more enjoyable yard.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/pricing">
                    <Button
                      className="bg-white text-primary hover:bg-white/90 text-lg w-full sm:w-auto"
                    >
                      View Subscription Plans
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button
                      variant="outline"
                      className="border-white text-white hover:bg-white/10 text-lg w-full sm:w-auto"
                    >
                      Sign Up Now
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