import { Metadata } from 'next/types';

export const metadata = {
  title: 'Terms of Service - ScoopifyClub',
  description: 'Terms of Service for ScoopifyClub dog waste removal services',
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                By accessing and using ScoopifyClub ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-700 mb-4">
                ScoopifyClub provides professional dog waste removal services. We connect customers with trained employees who provide yard cleaning services on a scheduled basis.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  To use our service, you must create an account. You are responsible for:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Maintaining the confidentiality of your account information</li>
                  <li>All activities that occur under your account</li>
                  <li>Providing accurate and complete information</li>
                  <li>Notifying us immediately of any unauthorized use</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Service Scheduling and Cancellation</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  Services are scheduled based on your subscription plan:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Weekly, bi-weekly, or monthly service options available</li>
                  <li>Cancellation requires 24-hour notice before scheduled service</li>
                  <li>No-shows may result in service charges</li>
                  <li>Weather-related cancellations will be rescheduled at no additional cost</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Payment Terms</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  Payment is processed through secure third-party payment processors:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>All fees are charged in advance of service</li>
                  <li>Prices are subject to change with 30-day notice</li>
                  <li>Refunds are provided according to our refund policy</li>
                  <li>Late payments may result in service suspension</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Service Quality and Satisfaction</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  We are committed to providing high-quality service:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>All employees are trained and background-checked</li>
                  <li>Service satisfaction is guaranteed</li>
                  <li>Issues must be reported within 24 hours of service</li>
                  <li>Re-service is provided for unsatisfactory work</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Privacy and Data Protection</h2>
              <p className="text-gray-700 mb-4">
                Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Limitation of Liability</h2>
              <p className="text-gray-700 mb-4">
                ScoopifyClub shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Termination</h2>
              <p className="text-gray-700 mb-4">
                We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Changes to Terms</h2>
              <p className="text-gray-700 mb-4">
                We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> legal@scoopify.club<br />
                  <strong>Phone:</strong> (555) 123-4567<br />
                  <strong>Address:</strong> 123 Business St, City, State 12345
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
} 