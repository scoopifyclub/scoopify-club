'use client'

import { useState } from 'react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp } from 'lucide-react'

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs = [
    {
      question: "How often do you provide service?",
      answer: "We offer weekly service to ensure your yard stays clean and fresh. Our team visits on the same day each week at a time that works best for you."
    },
    {
      question: "What happens if it rains on my service day?",
      answer: "If it rains on your scheduled service day, we'll automatically reschedule for the next available day. We'll notify you of any changes via email or text message."
    },
    {
      question: "How do I manage my subscription?",
      answer: "You can manage your subscription through your customer dashboard. Here you can update your payment method, change your service day, or pause/cancel your service."
    },
    {
      question: "What areas do you service?",
      answer: "We currently service the greater metropolitan area. Please check our service area map or contact us to confirm if we service your location."
    },
    {
      question: "Do you work with multiple dogs?",
      answer: "Yes! We offer different pricing tiers based on the number of dogs. Our team is experienced in handling yards with multiple pets."
    },
    {
      question: "What's included in the service?",
      answer: "Our service includes thorough cleaning of your yard, proper disposal of waste, and a detailed service report. We also provide special handling for any specific areas of concern."
    },
    {
      question: "How do I schedule my first service?",
      answer: "You can schedule your first service by signing up online or calling our office. We'll set up an initial consultation to understand your needs and schedule your first cleaning."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards and offer secure online payments through our website. All payments are processed through Stripe for your security."
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        {/* Hero Section */}
        <section className="relative py-24 bg-gradient-to-br from-neutral-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-neutral-900 sm:text-5xl md:text-6xl">
                Frequently Asked Questions
              </h1>
              <p className="mt-6 text-xl text-neutral-600 max-w-3xl mx-auto">
                Find answers to common questions about our service
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="border border-neutral-200 rounded-xl overflow-hidden"
                >
                  <button
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-neutral-50"
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  >
                    <span className="text-lg font-semibold text-neutral-900">
                      {faq.question}
                    </span>
                    {openIndex === index ? (
                      <ChevronUp className="h-5 w-5 text-neutral-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-neutral-500" />
                    )}
                  </button>
                  {openIndex === index && (
                    <div className="px-6 py-4 bg-neutral-50">
                      <p className="text-neutral-600">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-brand-primary">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">
              Still Have Questions?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Contact our friendly team for more information
            </p>
            <Button
              size="lg"
              className="bg-white text-brand-primary hover:bg-neutral-100"
            >
              Contact Us
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
} 