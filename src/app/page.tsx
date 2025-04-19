'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Calendar, Shield, Star, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-primary-50/30">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-100/20 to-transparent" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-gray-900 mb-6">
              Keep Your Yard Clean & 
              <span className="text-scoopGreen"> Poop-Free</span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 leading-relaxed">
              Professional dog waste removal service. We scoop, you relax. 
              Join the club and enjoy a clean yard all year round.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-scoopGreen hover:bg-primary-600 text-white px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  Join the Club
                </Button>
              </Link>
              <Link 
                href="/services" 
                className="text-base font-semibold text-gray-600 hover:text-scoopGreen transition-colors duration-200 flex items-center gap-2"
              >
                Learn more <span className="text-scoopGreen">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Why Choose Scoopify Club?
            </h2>
            <p className="text-xl text-gray-600">
              We make yard maintenance easy with our professional waste removal service.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-scoopGreen" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Professional Service</h3>
                  <p className="text-gray-600">Our trained technicians ensure your yard stays clean and healthy.</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-scoopGreen" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Flexible Scheduling</h3>
                  <p className="text-gray-600">Choose weekly, bi-weekly, or monthly service plans.</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
                    <Star className="w-6 h-6 text-scoopGreen" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Quality Guaranteed</h3>
                  <p className="text-gray-600">100% satisfaction guarantee on all our services.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-scoopGreen to-primary-600">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready for a Cleaner Yard?
            </h2>
            <p className="text-xl text-primary-100 mb-10">
              Join Scoopify Club today and enjoy a clean, poop-free yard all year round.
              No contracts, cancel anytime.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-white text-scoopGreen hover:bg-primary-50 px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  Get Started Now
                </Button>
              </Link>
              <Link href="/pricing" className="text-base font-semibold text-white hover:text-primary-100 transition-colors duration-200 flex items-center gap-2">
                View Pricing <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 