'use client'

import { Button } from '@/components/ui/button'
import { Dog, Users, Heart, Shield } from 'lucide-react'
import Image from 'next/image'

export default function AboutPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative py-24 bg-gradient-to-br from-neutral-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-neutral-900 sm:text-5xl md:text-6xl">
              About Scoopify
            </h1>
            <p className="mt-6 text-xl text-neutral-600 max-w-3xl mx-auto">
              We're on a mission to make pet waste removal simple, reliable, and hassle-free for pet owners everywhere.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-neutral-900 mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-neutral-600 mb-6">
                At Scoopify, we believe that pet ownership should be about joy and companionship, not cleaning up after your furry friends. Our mission is to provide professional, reliable pet waste removal services that give pet owners more time to enjoy their pets and less time worrying about yard maintenance.
              </p>
              <p className="text-lg text-neutral-600">
                We're committed to creating cleaner, safer outdoor spaces for pets and their families while promoting responsible pet ownership in our communities.
              </p>
            </div>
            <div className="relative">
              <div className="aspect-w-16 aspect-h-9 rounded-2xl overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop"
                  alt="Our team at work"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-neutral-900">
              Our Core Values
            </h2>
            <p className="mt-4 text-lg text-neutral-600">
              These principles guide everything we do
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="h-12 w-12 bg-brand-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Heart className="h-6 w-6 text-brand-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Passion for Pets</h3>
              <p className="text-neutral-600">
                We love animals and understand the importance of a clean, safe environment for them to thrive.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="h-12 w-12 bg-brand-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-brand-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Reliability</h3>
              <p className="text-neutral-600">
                We're committed to showing up on time, every time, with consistent, high-quality service.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="h-12 w-12 bg-brand-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-brand-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Community</h3>
              <p className="text-neutral-600">
                We're proud to serve our local communities and contribute to cleaner, healthier neighborhoods.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-neutral-900">
              Meet Our Team
            </h2>
            <p className="mt-4 text-lg text-neutral-600">
              The dedicated professionals behind Scoopify
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="h-32 w-32 mx-auto rounded-full bg-neutral-200 mb-4"></div>
              <h3 className="text-xl font-semibold">John Smith</h3>
              <p className="text-neutral-600">Founder & CEO</p>
            </div>
            <div className="text-center">
              <div className="h-32 w-32 mx-auto rounded-full bg-neutral-200 mb-4"></div>
              <h3 className="text-xl font-semibold">Sarah Johnson</h3>
              <p className="text-neutral-600">Operations Manager</p>
            </div>
            <div className="text-center">
              <div className="h-32 w-32 mx-auto rounded-full bg-neutral-200 mb-4"></div>
              <h3 className="text-xl font-semibold">Mike Davis</h3>
              <p className="text-neutral-600">Customer Success</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-brand-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Join the Scoopify Family?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Sign up today and experience the difference of professional pet waste removal.
          </p>
          <Button
            size="lg"
            className="bg-white text-brand-primary hover:bg-neutral-100"
          >
            Get Started
          </Button>
        </div>
      </section>
    </>
  )
} 