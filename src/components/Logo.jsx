'use client';

import Link from 'next/link';

/**
 * Scoopify Club brand lockup — bag + paw mark with wordmark.
 * @param {{ size?: 'sm' | 'md' | 'lg'; href?: string | null; className?: string; showWordmark?: boolean }} props
 */
export function Logo({ size = 'md', href = '/', className = '', showWordmark = true }) {
  const sizes = {
    sm: { mark: 28, text: 'text-lg' },
    md: { mark: 36, text: 'text-xl md:text-2xl' },
    lg: { mark: 56, text: 'text-5xl md:text-6xl' },
  };
  const s = sizes[size] || sizes.md;

  const lockup = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/scoopify-mark.svg"
        alt=""
        width={s.mark}
        height={s.mark}
        className="brand-mark-bob shrink-0"
        decoding="async"
      />
      {showWordmark && (
        <span className={`font-display font-semibold tracking-tight leading-none text-[color:var(--brand-ink)] ${s.text}`}>
          Scoopify
          <span className="font-medium text-[color:var(--brand-leaf)]"> Club</span>
        </span>
      )}
    </span>
  );

  if (href === null) {
    return lockup;
  }

  return (
    <Link href={href} className="inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded-md" aria-label="Scoopify Club home">
      {lockup}
    </Link>
  );
}

export default Logo;
