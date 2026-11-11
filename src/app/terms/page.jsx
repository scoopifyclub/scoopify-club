import Link from 'next/link';

const LAST_UPDATED = 'November 10, 2026';

export default function TermsPage() {
    return (
        <main className="min-h-screen bg-[color:var(--brand-surface)]">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
                <h1 className="text-4xl font-bold text-[color:var(--brand-ink)] mb-3">
                    Terms of Service
                </h1>
                <p className="text-[color:var(--brand-ink-muted)] mb-10">
                    Last updated: {LAST_UPDATED}
                </p>

                <div className="space-y-10 text-[color:var(--brand-ink-muted)] leading-relaxed">
                    <section>
                        <h2 className="text-2xl font-semibold text-[color:var(--brand-ink)] mb-3">
                            1. Agreement
                        </h2>
                        <p>
                            By creating an account or using Scoopify Club (&quot;Scoopify,&quot;
                            &quot;we,&quot; &quot;us&quot;), you agree to these Terms of Service. If you
                            do not agree, please do not use the service. These terms are written for our
                            current pilot — clear and accurate, not a full legal brief.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-[color:var(--brand-ink)] mb-3">
                            2. The service
                        </h2>
                        <p className="mb-3">
                            Scoopify provides professional dog waste removal, including recurring weekly
                            scoop visits and one-time catch-up cleanups. We are piloting locally from
                            Peyton, Colorado, with service focused on Peyton, Falcon, and nearby areas.
                            Coverage is ZIP-based during the pilot and may change as we learn.
                        </p>
                        <p>
                            Scoopers (our field teammates) visit the service address you provide to
                            remove pet waste from the agreed outdoor areas. Completion photos may be
                            taken to confirm the visit.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-[color:var(--brand-ink)] mb-3">
                            3. Your account and responsibilities
                        </h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Provide accurate contact, address, and access information</li>
                            <li>Keep your login credentials secure</li>
                            <li>
                                Make sure scoopers can safely reach the service area (gates, dogs,
                                hazards, locked areas, HOA rules)
                            </li>
                            <li>Tell us promptly if access, dogs, or schedule needs change</li>
                            <li>Pay for services you order at the prices shown at checkout</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-[color:var(--brand-ink)] mb-3">
                            4. Property access
                        </h2>
                        <p>
                            By scheduling service, you authorize Scoopify scoopers and ops staff to enter
                            the outdoor service areas you designate for the purpose of performing and
                            verifying the visit. You are responsible for securing pets and disclosing
                            anything that could make the visit unsafe.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-[color:var(--brand-ink)] mb-3">
                            5. Payments (Stripe)
                        </h2>
                        <p className="mb-3">
                            Payments are processed by Stripe. Recurring plans bill through Stripe
                            subscriptions; one-time cleanups are charged at checkout or as otherwise
                            shown before you pay. We do not store full card numbers on Scoopify servers.
                        </p>
                        <p>
                            Failed or overdue payments may pause scheduling until the balance is
                            resolved. Prices may change; we will show the amount before you confirm a
                            purchase and post material plan changes for existing subscribers with
                            reasonable notice when we can.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-[color:var(--brand-ink)] mb-3">
                            6. Scheduling, weather, and cancellation
                        </h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>
                                Recurring customers can cancel or change service by using account tools
                                where available or by emailing{' '}
                                <a
                                    href="mailto:services@scoopify.club"
                                    className="text-[color:var(--brand-leaf)] hover:text-[color:var(--brand-leaf-deep)] font-medium"
                                >
                                    services@scoopify.club
                                </a>
                                .
                            </li>
                            <li>
                                Please give at least 24 hours&apos; notice when you need to skip or move
                                a visit so we can reassign the route.
                            </li>
                            <li>
                                Weather, access issues, or operational limits may cause a visit to be
                                rescheduled. We will work with you to find the next available slot.
                            </li>
                            <li>
                                During the pilot, refunds are handled case by case. Unused prepaid time
                                may be credited or refunded when that is fair given work already
                                scheduled or completed — ask us and we will sort it out.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-[color:var(--brand-ink)] mb-3">
                            7. Acceptable use
                        </h2>
                        <p>
                            Do not misuse the site or accounts (fraud, scraping, harassment, or anything
                            illegal). We may suspend or close accounts that create safety, payment, or
                            abuse problems.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-[color:var(--brand-ink)] mb-3">
                            8. Disclaimers and limits
                        </h2>
                        <p className="mb-3">
                            Outdoor service depends on weather, access, and yard conditions. Scoopify
                            aims for reliable, professional visits, but we cannot guarantee a perfect
                            yard every time or uninterrupted availability during a pilot.
                        </p>
                        <p>
                            To the fullest extent allowed by law, Scoopify is not liable for indirect or
                            consequential damages (such as lost profits), or for issues outside our
                            reasonable control. Our total liability related to a visit or billing dispute
                            is limited to the fees you paid us for the service period at issue.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-[color:var(--brand-ink)] mb-3">
                            9. Privacy
                        </h2>
                        <p>
                            How we handle personal information — including sharing with Stripe, scoopers,
                            and ops — is described in our{' '}
                            <Link
                                href="/privacy"
                                className="text-[color:var(--brand-leaf)] hover:text-[color:var(--brand-leaf-deep)] font-medium"
                            >
                                Privacy Policy
                            </Link>
                            .
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-[color:var(--brand-ink)] mb-3">
                            10. Changes
                        </h2>
                        <p>
                            We may update these terms as the pilot grows. The &quot;Last updated&quot;
                            date at the top will change when we do. If you keep using Scoopify after an
                            update, the new terms apply.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-[color:var(--brand-ink)] mb-3">
                            11. Contact
                        </h2>
                        <p className="mb-3">
                            Questions about these terms? Email{' '}
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
                            Peyton / Falcon, CO
                            <br />
                            services@scoopify.club
                        </p>
                    </section>
                </div>
            </div>
        </main>
    );
}
