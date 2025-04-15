'use client'

import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import Link from "next/link"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="flex flex-col">
        {/* Hero Section */}
        <section className="relative flex flex-col items-center justify-center px-4 py-20 text-center sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
              Professional Dog Waste Removal Service
            </h1>
            <p className="mt-6 text-lg text-gray-600">
              Keep your yard clean and safe with our reliable and professional dog waste removal service.
              We make it easy to maintain a healthy outdoor space for you and your pets.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <Link href="/signup">
                <Button size="lg">Get Started</Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline">View Pricing</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-gray-50 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <div className="flex items-center">
                  <Check className="h-6 w-6 text-green-500" />
                  <h3 className="ml-3 text-lg font-medium">Professional Service</h3>
                </div>
                <p className="mt-4 text-gray-600">
                  Our trained professionals ensure thorough and efficient cleaning of your yard.
                </p>
              </div>
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <div className="flex items-center">
                  <Check className="h-6 w-6 text-green-500" />
                  <h3 className="ml-3 text-lg font-medium">Regular Cleanups</h3>
                </div>
                <p className="mt-4 text-gray-600">
                  Schedule regular cleanups to maintain a clean and healthy outdoor space.
                </p>
              </div>
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <div className="flex items-center">
                  <Check className="h-6 w-6 text-green-500" />
                  <h3 className="ml-3 text-lg font-medium">Peace of Mind</h3>
                </div>
                <p className="mt-4 text-gray-600">
                  Enjoy your yard without worrying about pet waste cleanup.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-lg bg-gray-900 px-6 py-16 sm:p-16">
              <div className="mx-auto max-w-xl lg:max-w-none">
                <div className="text-center">
                  <h2 className="text-3xl font-bold tracking-tight text-white">
                    Ready to get started?
                  </h2>
                  <p className="mt-4 text-lg text-gray-300">
                    Sign up today and enjoy a clean yard without the hassle.
                  </p>
                  <div className="mt-8 flex justify-center gap-4">
                    <Link href="/signup">
                      <Button size="lg">Get Started</Button>
                    </Link>
                    <Link href="/pricing">
                      <Button size="lg" variant="outline">View Pricing</Button>
                    </Link>
                  </div>
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