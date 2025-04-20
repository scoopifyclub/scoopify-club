'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  
  // Check if user is logged in and redirect to dashboard
  useEffect(() => {
    // Check for access token in cookies
    const checkAuth = () => {
      const cookies = document.cookie.split(';');
      const accessTokenCookie = cookies.find(cookie => cookie.trim().startsWith('accessToken='));
      
      if (accessTokenCookie) {
        // User has an access token, redirect to customer dashboard
        router.push('/customer/dashboard');
      }
    };
    
    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-neutral-900">
                Professional Dog Waste Removal
                <span className="text-primary block">Made Simple</span>
              </h1>
              <p className="text-xl text-neutral-600 leading-relaxed">
                We keep your yard clean so you can enjoy more time with your pets.
                Join the club and experience hassle-free yard maintenance.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/signup" 
                  className="inline-flex items-center justify-center bg-primary text-white font-semibold px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors duration-200"
                >
                  <FontAwesomeIcon icon={['fas', 'paw']} className="mr-2 h-4 w-4" />
                  Join the Club
                </Link>
                <Link 
                  href="/services" 
                  className="inline-flex items-center justify-center bg-white text-primary border-2 border-primary font-semibold px-6 py-3 rounded-lg hover:bg-primary hover:text-white transition-colors duration-200"
                >
                  <FontAwesomeIcon icon={['fas', 'circle-info']} className="mr-2 h-4 w-4" />
                  Learn More
                </Link>
                <Link 
                  href="/auth/scooper-signup" 
                  className="inline-flex items-center justify-center border-2 border-primary text-primary font-semibold px-6 py-3 rounded-lg hover:bg-primary hover:text-white transition-colors duration-200"
                >
                  <FontAwesomeIcon icon={['fas', 'broom']} className="mr-2 h-4 w-4" />
                  Become a Scooper
                </Link>
              </div>
            </div>
            <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="/dog-hero.jpg"
                alt="Happy dog in clean yard"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-neutral-900">
              Why Choose Scoopify Club?
            </h2>
            <p className="text-xl text-neutral-600">
              We make yard maintenance easy with our professional waste removal service.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <FontAwesomeIcon icon={['fas', 'broom']} className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-neutral-900">Professional Service</h3>
                  <p className="text-neutral-600">Our trained technicians ensure your yard stays clean and healthy.</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <FontAwesomeIcon icon={['fas', 'calendar']} className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-neutral-900">Flexible Scheduling</h3>
                  <p className="text-neutral-600">Choose weekly, bi-weekly, or monthly service plans.</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <FontAwesomeIcon icon={['fas', 'star']} className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-neutral-900">Quality Guaranteed</h3>
                  <p className="text-neutral-600">100% satisfaction guarantee on all our services.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary to-primary-dark">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-4xl font-bold mb-6">
              Ready for a Cleaner Yard?
            </h2>
            <p className="text-xl text-white/90 mb-10">
              Join Scoopify Club today and enjoy a clean, poop-free yard all year round.
              No contracts, cancel anytime.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/signup" 
                className="inline-flex items-center justify-center bg-white text-primary font-semibold px-6 py-3 rounded-lg hover:bg-neutral-100 transition-colors duration-200 shadow-lg"
              >
                <FontAwesomeIcon icon={['fas', 'circle-check']} className="mr-2 h-4 w-4" />
                Get Started Now
              </Link>
              <Link 
                href="/pricing" 
                className="inline-flex items-center text-white font-semibold hover:text-white/80 transition-colors duration-200 group"
              >
                <FontAwesomeIcon icon={['fas', 'tags']} className="mr-2 h-4 w-4" />
                View Pricing
                <span className="ml-2 group-hover:translate-x-1 transition-transform duration-200">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 