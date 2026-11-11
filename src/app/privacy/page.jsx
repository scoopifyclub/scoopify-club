import Link from 'next/link';

const LAST_UPDATED = 'November 10, 2026';

export default function PrivacyPage() {
    return (
        <main className="min-h-screen bg-[color:var(--brand-surface)]">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
                <h1 className="text-4xl font-bold text-[color:var(--brand-ink)] mb-3">
                    Privacy Policy
                </h1>
                <p className="text-[color:var(--brand-ink-muted)] mb-10">
                    Last updated: {LAST_UPDATED}
                </p>

                <div className="space-y-10 text-[color:var(--brand-ink-muted)] leading-relaxed">
                    <section>
                        <h2 className="text-2xl font-semibold text-[color:var(--brand-ink)] mb-3">
                            1. Who we are
                        </h2>
                        <p>
                            Scoopify Club (&quot;Scoopify,&quot; &quot;we,&quot; &quot;us&quot;) provides weekly dog
                            waste removal and catch-up cleanups. We are currently running a local pilot
                            serving Colorado Springs and Falcon, Colorado. This
                            page explains how we handle information in plain language for that pilot —
                            it is not a lawyer-drafted policy.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-[color:var(--brand-ink)] mb-3">
                            2. Information we collect
                        </h2>
                        <p className="mb-3">Depending on how you use Scoopify, we may collect:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>
                                <strong className="text-[color:var(--brand-ink)]">Account &amp; contact details</strong>
                                {' '}— name, email, phone number, and password (stored hashed).
                            </li>
                            <li>
                                <strong className="text-[color:var(--brand-ink)]">Service details</strong>
                                {' '}— service address, gate/access notes, preferred service day, dog
                                count, and related preferences you give us.
                            </li>
                            <li>
                                <strong className="text-[color:var(--brand-ink)]">Payment information</strong>
                                {' '}— billing is handled by Stripe. We receive payment status and Stripe
                                customer/subscription identifiers; we do not store full card numbers on
                                our servers.
                            </li>
                            <li>
                                <strong className="text-[color:var(--brand-ink)]">Service records</strong>
                                {' '}— visit history, completion photos scoopers upload for quality
                                checks, messages you send us, and basic site logs (such as IP address
                                and device/browser info) needed to run and secure the product.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-[color:var(--brand-ink)] mb-3">
                            3. How we use information
                        </h2>
                        <p className="mb-3">We use this information to:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Create accounts, schedule visits, and perform scoop service</li>
                            <li>Process payments and manage subscriptions through Stripe</li>
                            <li>Communicate about visits, billing, support, and service changes</li>
                            <li>Verify completed work and improve ops during the pilot</li>
                            <li>Comply with law and protect against fraud or abuse</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-[color:var(--brand-ink)] mb-3">
                            4. Who we share information with
                        </h2>
                        <p className="mb-3">
                            We do <em>not</em> sell your personal information. We also do not pretend
                            that data never leaves our systems — running a scoop service requires sharing
                            what is needed with people and tools that help us deliver it:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>
                                <strong className="text-[color:var(--brand-ink)]">Stripe</strong>
                                {' '}— to process payments, subscriptions, and related billing events.
                                Stripe has its own privacy policy for payment data.
                            </li>
                            <li>
                                <strong className="text-[color:var(--brand-ink)]">Scoopers and ops</strong>
                                {' '}— assigned scoopers and Scoopify operators receive the service
                                address, access notes, schedule, and related job details needed to
                                clean the yard and confirm the visit.
                            </li>
                            <li>
                                <strong className="text-[color:var(--brand-ink)]">Infrastructure providers</strong>
                                {' '}— hosting, email, storage, and similar vendors that process data on
                                our behalf so the site and notifications work.
                            </li>
                            <li>
                                <strong className="text-[color:var(--brand-ink)]">Legal requirements</strong>
                                {' '}— if we are required by a valid legal process, or need to protect
                                people, property, or our rights.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-[color:var(--brand-ink)] mb-3">
                            5. Photos and location
                        </h2>
                        <p>
                            Scoopers typically upload completion photos so we can confirm the visit.
                            Those photos are used for quality and customer visibility, not for sale or
                            advertising without asking you. Service addresses are used for routing and
                            job assignment in the pilot area.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-[color:var(--brand-ink)] mb-3">
                            6. Retention and your choices
                        </h2>
                        <p className="mb-3">
                            We keep account, billing, and service records while you are a customer and
                            for a reasonable period afterward for support, accounting, and dispute
                            handling. You can ask us to:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Correct inaccurate account or service details</li>
                            <li>Cancel service or close an account</li>
                            <li>Delete information we no longer need to keep for ops or legal reasons</li>
                            <li>Stop non-essential marketing messages (service and billing messages still go through)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-[color:var(--brand-ink)] mb-3">
                            7. Changes
                        </h2>
                        <p>
                            As the pilot evolves, we may update this page. The &quot;Last updated&quot;
                            date at the top will change when we do. Continued use of Scoopify after an
                            update means you are okay with the revised practices described here.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-[color:var(--brand-ink)] mb-3">
                            8. Contact
                        </h2>
                        <p className="mb-3">
                            Questions about privacy or your data? Email{' '}
                            <a
                                href="mailto:services@scoopify.club"
                                className="text-[color:var(--brand-leaf)] hover:text-[color:var(--brand-leaf-deep)] font-medium"
                            >
                                services@scoopify.club
                            </a>
                            .
                        </p>
                        <p>
                            Scoopify Club
                            <br />
                            Colorado Springs &amp; Falcon, CO
                            <br />
                            services@scoopify.club
                        </p>
                        <p className="mt-6">
                            Related:{' '}
                            <Link
                                href="/terms"
                                className="text-[color:var(--brand-leaf)] hover:text-[color:var(--brand-leaf-deep)] font-medium"
                            >
                                Terms of Service
                            </Link>
                        </p>
                    </section>
                </div>
            </div>
        </main>
    );
}
