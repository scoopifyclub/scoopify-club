'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Logo } from '@/components/Logo';

/**
 * Shared marketing hero — brand-first composition for landing surfaces.
 * @returns {JSX.Element} The rendered component
 */
export function Hero() {
    return (
      <section className="relative isolate min-h-[70vh] overflow-hidden hero-atmosphere">
        <div className="absolute inset-0" aria-hidden="true">
          <div className="absolute inset-0 overflow-hidden">
            <Image
              src="/images/dogs-backyard.jpg"
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-[center_35%] hero-visual-plane opacity-[0.42]"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--brand-surface)] via-[color:var(--brand-surface)]/88 to-[color:var(--brand-surface)]/35" />
          <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--brand-mist)]/80 via-transparent to-[color:var(--brand-sky)]/25" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex min-h-[70vh] items-center py-16">
          <div className="max-w-2xl">
            <div className="hero-reveal hero-reveal-delay-1 mb-8">
              <Logo size="lg" href={null} />
            </div>
            <h1 className="hero-reveal hero-reveal-delay-2 font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[color:var(--brand-ink)]">
              Yard clean. Life easy.
            </h1>
            <p className="hero-reveal hero-reveal-delay-3 mt-5 max-w-xl text-lg text-[color:var(--brand-ink-muted)]">
              Weekly dog waste removal for Colorado Springs &amp; Falcon, Colorado.
            </p>
            <div className="hero-reveal hero-reveal-delay-4 mt-9 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link href="/signup" className="brand-cta-primary inline-flex items-center justify-center font-semibold px-6 py-3.5 rounded-xl">
                Join the Club
              </Link>
              <Link href="/pricing" className="brand-cta-secondary inline-flex items-center justify-center font-semibold px-6 py-3.5 rounded-xl">
                See pricing
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
}
