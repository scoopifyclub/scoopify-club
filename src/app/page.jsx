'use client';
import Link from 'next/link';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBroom, faCalendar, faStar, faCircleCheck, faTags, faMobileScreen, faCamera, faThumbsUp } from '@fortawesome/free-solid-svg-icons';
import { Logo } from '@/components/Logo';

const SafeIcon = ({ icon, className, ...props }) => {
    try {
        return <FontAwesomeIcon icon={icon} className={className} {...props} />;
    } catch (error) {
        console.warn('FontAwesome icon error:', error);
        return <span className={`inline-block w-4 h-4 ${className || ''}`} {...props}>•</span>;
    }
};

/**
 * Home page component
 * @returns {JSX.Element} The rendered component
 */
export default function Home() {
    return (<div className="min-h-screen bg-[color:var(--brand-surface)]">
      {/* First viewport — one composition: brand, headline, sentence, CTAs, full-bleed visual */}
      <section className="relative isolate min-h-[calc(100dvh-4.25rem)] overflow-hidden hero-atmosphere">
        <div className="absolute inset-0" aria-hidden="true">
          <div className="absolute inset-0 overflow-hidden">
            <Image
              src="/images/dogs-backyard.jpg"
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-[center_35%] hero-visual-plane opacity-[0.58]"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--brand-surface)] via-[color:var(--brand-surface)]/78 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--brand-mist)]/70 via-transparent to-[color:var(--brand-sky)]/30" />
          <div
            className="absolute inset-0 opacity-[0.18] mix-blend-multiply"
            style={{
              backgroundImage:
                'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%236F9A34\' fill-opacity=\'0.35\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            }}
          />
        </div>

        <div className="relative container mx-auto px-4 flex min-h-[calc(100dvh-4.25rem)] items-center py-16 md:py-20">
          <div className="max-w-2xl">
            <div className="hero-reveal hero-reveal-delay-1 mb-8 md:mb-10">
              <Logo size="lg" href={null} />
            </div>

            <h1 className="hero-reveal hero-reveal-delay-2 font-display text-2xl sm:text-3xl md:text-[2.15rem] font-medium tracking-tight text-[color:var(--brand-ink)] leading-[1.2]">
              Yard clean. Life easy.
            </h1>

            <p className="hero-reveal hero-reveal-delay-3 mt-5 max-w-xl text-base md:text-lg text-[color:var(--brand-ink-muted)] leading-relaxed">
              Weekly dog waste removal for Colorado Springs &amp; Falcon, Colorado — so you can enjoy the yard again.
            </p>

            <div className="hero-reveal hero-reveal-delay-4 mt-9 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link
                href="/signup"
                className="brand-cta-primary inline-flex items-center justify-center font-semibold px-6 py-3.5 rounded-xl text-base transition-transform duration-200 hover:-translate-y-0.5"
              >
                Join the Club
              </Link>
              <Link
                href="/pricing"
                className="brand-cta-secondary inline-flex items-center justify-center font-semibold px-6 py-3.5 rounded-xl text-base transition-transform duration-200 hover:-translate-y-0.5"
              >
                See pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-[color:var(--brand-surface)]">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-semibold mb-4 text-[color:var(--brand-ink)]">
              Why Choose Scoopify Club?
            </h2>
            <p className="text-lg text-[color:var(--brand-ink-muted)]">
              Recurring weekly scoop service for the Colorado Springs &amp; Falcon pilot — with catch-up cleanups when a yard needs a reset first.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-[color:var(--brand-mist)] flex items-center justify-center">
                <SafeIcon icon={faBroom} className="w-5 h-5 text-[color:var(--brand-leaf)]"/>
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold mb-2 text-[color:var(--brand-ink)]">Weekly Recurring Scoop</h3>
                <p className="text-[color:var(--brand-ink-muted)]">Same-day visits each week, plus an optional catch-up cleanup before your club schedule starts.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-[color:var(--brand-mist)] flex items-center justify-center">
                <SafeIcon icon={faCalendar} className="w-5 h-5 text-[color:var(--brand-leaf)]"/>
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold mb-2 text-[color:var(--brand-ink)]">Flexible Scheduling</h3>
                <p className="text-[color:var(--brand-ink-muted)]">Pick your service day and manage the calendar from your account.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-[color:var(--brand-mist)] flex items-center justify-center">
                <SafeIcon icon={faMobileScreen} className="w-5 h-5 text-[color:var(--brand-leaf)]"/>
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold mb-2 text-[color:var(--brand-ink)]">Photo Updates</h3>
                <p className="text-[color:var(--brand-ink-muted)]">Completion photos and status in your dashboard after every visit.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-semibold mb-4 text-[color:var(--brand-ink)]">
              Smart Pet Waste Management
            </h2>
            <p className="text-lg text-[color:var(--brand-ink-muted)]">
              Built for busy dog households in Colorado Springs and Falcon.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div>
              <SafeIcon icon={faMobileScreen} className="w-7 h-7 text-[color:var(--brand-leaf)] mb-4"/>
              <h3 className="font-display text-xl font-semibold text-[color:var(--brand-ink)] mb-2">Digital Dashboard</h3>
              <p className="text-[color:var(--brand-ink-muted)]">Services, history, and schedule in one place.</p>
            </div>
            <div>
              <SafeIcon icon={faCamera} className="w-7 h-7 text-[color:var(--brand-leaf)] mb-4"/>
              <h3 className="font-display text-xl font-semibold text-[color:var(--brand-ink)] mb-2">Photo Verification</h3>
              <p className="text-[color:var(--brand-ink-muted)]">Before and after photos after every cleanup.</p>
            </div>
            <div>
              <SafeIcon icon={faThumbsUp} className="w-7 h-7 text-[color:var(--brand-leaf)] mb-4"/>
              <h3 className="font-display text-xl font-semibold text-[color:var(--brand-ink)] mb-2">Satisfaction Tracking</h3>
              <p className="text-[color:var(--brand-ink-muted)]">Rate each visit so quality stays consistent.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-20 bg-[color:var(--brand-mist)]/60">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div className="relative h-[360px] md:h-[420px] overflow-hidden rounded-2xl">
              <Image
                src="/images/golden-retriever.jpg"
                alt="Golden retriever relaxing in a clean backyard"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <div className="space-y-5">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (<FontAwesomeIcon key={i} icon={faStar} className="h-5 w-5 text-[color:var(--brand-leaf)]"/>))}
              </div>
              <blockquote className="font-display text-2xl font-medium text-[color:var(--brand-ink)] leading-snug">
                &ldquo;Since using Scoopify Club, our backyard has become a clean, safe haven for our family and pets. The photo updates after each service give us complete peace of mind!&rdquo;
              </blockquote>
              <div className="font-semibold text-[color:var(--brand-ink)]">
                Jessica L. · Dog parent to Max &amp; Bella
              </div>
              <p className="text-[color:var(--brand-ink-muted)]">
                Weekly service subscriber
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[color:var(--brand-leaf)]">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h2 className="font-display text-3xl md:text-4xl font-semibold mb-5">
              Ready for a cleaner yard?
            </h2>
            <p className="text-lg text-white/90 mb-10">
              Join the Colorado Springs &amp; Falcon pilot — weekly scoop service so you spend less time cleaning and more time outside with your dogs.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup" className="inline-flex items-center justify-center bg-white text-[color:var(--brand-leaf-deep)] font-semibold px-6 py-3.5 rounded-xl hover:bg-[color:var(--brand-mist)] transition-colors duration-200">
                <FontAwesomeIcon icon={faCircleCheck} className="mr-2 h-4 w-4"/>
                Get Started
              </Link>
              <Link href="/pricing" className="inline-flex items-center text-white font-semibold hover:text-white/85 transition-colors duration-200 group">
                <FontAwesomeIcon icon={faTags} className="mr-2 h-4 w-4"/>
                View Pricing
                <span className="ml-2 group-hover:translate-x-1 transition-transform duration-200">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>);
}
