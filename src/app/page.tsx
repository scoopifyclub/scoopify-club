'use client'

import { Hero } from '@/components/Hero'
import { Pricing } from '@/components/Pricing'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Check } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero />
        
        {/* Features Section */}
        <section className="py-24 bg-neutral-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
                Why Choose Scoopify?
              </h2>
              <p className="mt-4 text-lg text-neutral-600">
                We make pet waste removal simple, reliable, and hassle-free
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-xl shadow-sm">
                <div className="h-12 w-12 bg-brand-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Check className="h-6 w-6 text-brand-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Weekly Service</h3>
                <p className="text-neutral-600">
                  Regular, reliable service to keep your yard clean and safe for your pets and family.
                </p>
              </div>
              <div className="bg-white p-8 rounded-xl shadow-sm">
                <div className="h-12 w-12 bg-brand-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Check className="h-6 w-6 text-brand-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Professional Team</h3>
                <p className="text-neutral-600">
                  Our trained professionals handle everything with care and attention to detail.
                </p>
              </div>
              <div className="bg-white p-8 rounded-xl shadow-sm">
                <div className="h-12 w-12 bg-brand-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Check className="h-6 w-6 text-brand-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Easy Scheduling</h3>
                <p className="text-neutral-600">
                  Flexible scheduling options to fit your busy lifestyle.
                </p>
              </div>
            </div>
          </div>
        </section>

        <Pricing />

        {/* Testimonials Section */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
                What Our Customers Say
              </h2>
              <p className="mt-4 text-lg text-neutral-600">
                Don't just take our word for it - hear from our satisfied customers
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-neutral-50 p-8 rounded-xl">
                <p className="text-neutral-600 mb-4">
                  "Scoopify has been a game-changer for our family. No more worrying about cleaning up after our two dogs. The service is reliable and the team is professional."
                </p>
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-neutral-200 rounded-full mr-4"></div>
                  <div>
                    <p className="font-semibold">Sarah M.</p>
                    <p className="text-sm text-neutral-500">Happy Customer</p>
                  </div>
                </div>
              </div>
              <div className="bg-neutral-50 p-8 rounded-xl">
                <p className="text-neutral-600 mb-4">
                  "I've been using Scoopify for over a year now and couldn't be happier. The weekly service keeps our yard clean and our dogs healthy. Highly recommend!"
                </p>
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-neutral-200 rounded-full mr-4"></div>
                  <div>
                    <p className="font-semibold">Michael R.</p>
                    <p className="text-sm text-neutral-500">Loyal Customer</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 bg-neutral-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
                Frequently Asked Questions
              </h2>
              <p className="mt-4 text-lg text-neutral-600">
                Everything you need to know about our service
              </p>
            </div>
            <div className="max-w-3xl mx-auto space-y-8">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-xl font-semibold mb-2">How often do you service my yard?</h3>
                <p className="text-neutral-600">
                  We provide weekly service to keep your yard clean and safe. You can choose your preferred day of the week for service.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-xl font-semibold mb-2">What happens if it rains on my service day?</h3>
                <p className="text-neutral-600">
                  We'll reschedule your service for the next available day. Your safety and our team's safety are our top priorities.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-xl font-semibold mb-2">How do I cancel or pause my service?</h3>
                <p className="text-neutral-600">
                  You can easily manage your subscription through your customer dashboard. We require 48 hours notice for any changes to your service schedule.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-brand-primary">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
            <p className="text-lg text-white/90 mb-8">Join hundreds of satisfied customers who trust Scoopify with their pet waste removal needs.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/signup" 
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-brand-primary bg-white hover:bg-neutral-50"
              >
                Get Started
              </Link>
              <Link 
                href="/pricing" 
                className="inline-flex items-center justify-center px-6 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-white/10"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
} 