'use client';
export default function TermsPage() {
    return (<>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          
          <p className="text-gray-600 mb-6">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-600 mb-4">
              By accessing and using ScoopifyClub's services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Service Description</h2>
            <p className="text-gray-600 mb-4">
              ScoopifyClub provides professional dog waste removal services. Our services include:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Regular yard cleaning</li>
              <li>One-time cleanups</li>
              <li>Special event cleanup</li>
              <li>Related pet waste management services</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Responsibilities</h2>
            <p className="text-gray-600 mb-4">
              As a user of our services, you agree to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account</li>
              <li>Pay for services as agreed</li>
              <li>Provide access to the service area</li>
              <li>Notify us of any changes to your service needs</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Payment Terms</h2>
            <p className="text-gray-600 mb-4">
              Payment for services is required as follows:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Regular service: Monthly billing</li>
              <li>One-time service: Payment due at time of service</li>
              <li>Late payments may incur additional fees</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Cancellation Policy</h2>
            <p className="text-gray-600 mb-4">
              You may cancel your service at any time with the following conditions:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Regular service: 30 days notice required</li>
              <li>One-time service: 24 hours notice required</li>
              <li>Refunds for prepaid services will be prorated</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Limitation of Liability</h2>
            <p className="text-gray-600 mb-4">
              ScoopifyClub is not liable for:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Indirect or consequential damages</li>
              <li>Loss of profits or business interruption</li>
              <li>Events beyond our reasonable control</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Changes to Terms</h2>
            <p className="text-gray-600 mb-4">
              We reserve the right to modify these terms at any time. We will notify you of any changes by posting the new terms on this page.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Contact Information</h2>
            <p className="text-gray-600">
              For questions about these Terms of Service, please contact us at:
            </p>
            <p className="text-gray-600">
              Email: legal@scoopify.com<br />
              Phone: (555) 123-4567<br />
              Address: 123 Pet Care Ave, City, State 12345
            </p>
          </section>
        </div>
      </main>
    </>);
}
