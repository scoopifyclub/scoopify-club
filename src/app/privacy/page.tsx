'use client'

import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        {/* Hero Section */}
        <section className="relative py-24 bg-gradient-to-br from-neutral-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-neutral-900 sm:text-5xl md:text-6xl">
                Privacy Policy
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
              <h2>Introduction</h2>
              <p>
                At Scoopify, we take your privacy seriously. This Privacy Policy describes how we collect, use, and protect your personal information when you use our services.
              </p>

              <h2>Information We Collect</h2>
              <p>We collect information that you provide directly to us, including:</p>
              <ul>
                <li>Contact information (name, email, phone number, address)</li>
                <li>Payment information (processed securely through Stripe)</li>
                <li>Service preferences and scheduling information</li>
                <li>Communication preferences</li>
              </ul>

              <h2>How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul>
                <li>Provide and maintain our services</li>
                <li>Process your payments</li>
                <li>Communicate with you about your service</li>
                <li>Send you important updates and notifications</li>
                <li>Improve our services</li>
              </ul>

              <h2>Information Sharing</h2>
              <p>
                We do not sell or rent your personal information to third parties. We may share your information with:
              </p>
              <ul>
                <li>Service providers who assist in our operations</li>
                <li>Payment processors (Stripe)</li>
                <li>Legal authorities when required by law</li>
              </ul>

              <h2>Data Security</h2>
              <p>
                We implement appropriate security measures to protect your personal information. However, no method of transmission over the internet is 100% secure.
              </p>

              <h2>Your Rights</h2>
              <p>You have the right to:</p>
              <ul>
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your information</li>
                <li>Opt-out of marketing communications</li>
              </ul>

              <h2>Cookies and Tracking</h2>
              <p>
                We use cookies and similar tracking technologies to improve your experience on our website. You can control cookie settings through your browser.
              </p>

              <h2>Children's Privacy</h2>
              <p>
                Our services are not intended for children under 13. We do not knowingly collect personal information from children under 13.
              </p>

              <h2>Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page.
              </p>

              <h2>Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <ul>
                <li>Email: privacy@scoopify.club</li>
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