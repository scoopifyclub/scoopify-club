'use client';

import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import Link from 'next/link';

/**
 * Hero component for the landing page
 * @returns {JSX.Element} The rendered component
 */
export function Hero() {
    return (<section className="relative overflow-hidden bg-gradient-to-br from-brand-primary/10 via-white to-brand-primary/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl md:text-6xl">
            Professional Dog Waste Removal Service
          </h1>
          <p className="mt-6 text-lg text-neutral-600 max-w-3xl mx-auto">
            Keep your yard clean and safe with our reliable weekly service. No more worrying about pet waste - we handle it all!
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-brand-primary hover:bg-brand-primary-dark">
              <Link href="/signup">Get Started</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <Check className="h-6 w-6 text-brand-primary"/>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Professional Service</h3>
              <p className="text-neutral-600">Trained experts handle everything</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <Check className="h-6 w-6 text-brand-primary"/>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Regular Cleanups</h3>
              <p className="text-neutral-600">Weekly service to keep your yard clean</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <Check className="h-6 w-6 text-brand-primary"/>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Peace of Mind</h3>
              <p className="text-neutral-600">Reliable service you can count on</p>
            </div>
          </div>
        </div>
      </div>
    </section>);
}
