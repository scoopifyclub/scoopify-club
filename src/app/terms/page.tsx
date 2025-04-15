'use client'

import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        {/* Hero Section */}
        <section className="relative py-24 bg-gradient-to-br from-neutral-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-neutral-900 sm:text-5xl md:text-6xl">
                Terms of Service
              </h1>
              <p className="mt-6 text-xl text-neutral-600 max-w-3xl mx-auto">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-24 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="prose prose-lg prose-neutral">
              <h2>1. Agreement to Terms</h2>
              <p>
                By accessing or using Scoopify's services, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.
              </p>

              <h2>2. Service Description</h2>
              <p>
                Scoopify provides professional pet waste removal services. Our services include:
              </p>
              <ul>
                <li>Weekly yard cleaning</li>
                <li>Proper waste disposal</li>
                <li>Service reports</li>
                <li>Flexible scheduling</li>
              </ul>

              <h2>3. Subscription and Payment</h2>
              <p>
                Our services are provided on a subscription basis. By subscribing, you agree to:
              </p>
              <ul>
                <li>Pay the agreed-upon monthly fee</li>
                <li>Provide accurate billing information</li>
                <li>Authorize automatic monthly payments</li>
                <li>Give 48 hours notice for service changes</li>
              </ul>

              <h2>4. Cancellation Policy</h2>
              <p>
                You may cancel your subscription at any time with 48 hours notice. No refunds will be provided for partial months of service.
              </p>

              <h2>5. Service Area and Access</h2>
              <p>
                You agree to provide safe and unobstructed access to your property for our service team. We reserve the right to refuse service if access is unsafe or obstructed.
              </p>

              <h2>6. Weather and Service Interruptions</h2>
              <p>
                We may reschedule service due to inclement weather or other safety concerns. We will make reasonable efforts to notify you of any service interruptions.
              </p>

              <h2>7. Liability</h2>
              <p>
                Scoopify is not liable for any damages to property or injury to persons or pets that occur during or after our service, except in cases of gross negligence.
              </p>

              <h2>8. Privacy</h2>
              <p>
                Your use of our services is also governed by our Privacy Policy. Please review our Privacy Policy to understand how we collect and use your information.
              </p>

              <h2>9. Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. We will notify you of any changes by posting the new terms on this page.
              </p>

              <h2>10. Contact Information</h2>
              <p>
                For any questions about these Terms of Service, please contact us at:
              </p>
              <ul>
                <li>Email: legal@scoopify.club</li>
                <li>Phone: (555) 123-4567</li>
                <li>Address: 123 Pet Care Way, Dogtown, CA 90210</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
} 