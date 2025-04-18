import { Button } from '@/components/ui/button';
import { Dog, Calendar, Shield, Sparkles, CheckCircle2, Clock, Award, Heart, Smartphone, Bell, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-32 bg-gradient-to-br from-primary/5 to-white">
        <div className="absolute inset-0 bg-[url('/images/hero-pattern.svg')] opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-neutral-900 sm:text-6xl md:text-7xl">
              Professional Pet Waste Removal Service
            </h1>
            <p className="mt-8 text-2xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
              Weekly service to keep your yard pristine. More time for play, less time for cleanup.
            </p>
            <div className="mt-12 flex justify-center gap-6">
              <Link href="/signup">
                <Button size="lg" className="text-lg px-8 py-6">
                  Get Started Today
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-neutral-900">
              Why Choose Scoopify?
            </h2>
            <p className="mt-6 text-xl text-neutral-600 max-w-2xl mx-auto">
              We're not just a cleaning service - we're your partner in maintaining a healthy, happy home for your pets
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="h-16 w-16 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Weekly Service</h3>
              <p className="text-neutral-600 text-lg">
                Consistent weekly visits to ensure your yard stays clean and fresh
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="h-16 w-16 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Professional Team</h3>
              <p className="text-neutral-600 text-lg">
                Fully insured, background-checked professionals who treat your yard with care
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="h-16 w-16 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <Smartphone className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Smart App</h3>
              <p className="text-neutral-600 text-lg">
                Track services, manage payments, and communicate with your scooper
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="h-16 w-16 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Pet Health Focus</h3>
              <p className="text-neutral-600 text-lg">
                Creating a safer, healthier environment for your pets to play
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-32 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-neutral-900 mb-8">
                The Scoopify Difference
              </h2>
              <ul className="space-y-6">
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Bell className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-semibold text-neutral-900">Real-Time Notifications</h3>
                    <p className="mt-2 text-lg text-neutral-600">
                      Get instant updates when your service is completed
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-semibold text-neutral-900">Service Tracking</h3>
                    <p className="mt-2 text-lg text-neutral-600">
                      View service history and track your scooper's location
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Dog className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-semibold text-neutral-900">Pet Safety First</h3>
                    <p className="mt-2 text-lg text-neutral-600">
                      Using pet-safe products and techniques to protect your furry friends
                    </p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-w-16 aspect-h-9 rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="/images/clean-yard.jpg"
                  alt="Clean yard with happy dog"
                  className="object-cover w-full h-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/cta-pattern.svg')] opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-4xl font-bold text-white mb-8">
            Ready to Enjoy a Cleaner Yard?
          </h2>
          <p className="text-2xl text-white/90 mb-12 max-w-2xl mx-auto">
            Join thousands of pet owners who trust Scoopify for weekly professional pet waste removal.
          </p>
          <div className="flex justify-center gap-6">
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                Get Started Today
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white text-white hover:bg-white/10">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
} 