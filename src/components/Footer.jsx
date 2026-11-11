'use client';

import Link from 'next/link';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';
import { Logo } from '@/components/Logo';

/**
 * @typedef {Object} NavigationItem
 * @property {string} name - The name of the navigation item
 * @property {string} href - The URL of the navigation item
 */

/**
 * @typedef {Object} Navigation
 * @property {NavigationItem[]} main
 * @property {NavigationItem[]} legal
 */

/**
 * @typedef {Object} ContactInfo
 * @property {React.ComponentType} icon - The icon component
 * @property {string} text - The contact information text
 * @property {string} href - The URL for the contact information
 */

/**
 * @typedef {Object} SocialLink
 * @property {string} name - The name of the social media platform
 * @property {React.ComponentType} icon - The icon component
 * @property {string} href - The URL of the social media profile
 */

/**
 * Navigation items for the main menu
 * @type {NavigationItem[]}
 */
const navigation = {
    main: [
        { name: 'Home', href: '/' },
        { name: 'Services', href: '/services' },
        { name: 'Pricing', href: '/pricing' },
        { name: 'About', href: '/about' },
        { name: 'Contact', href: '/contact' },
    ],
    legal: [
        { name: 'Privacy', href: '/privacy' },
        { name: 'Terms', href: '/terms' },
    ],
};

/**
 * Contact information items
 * @type {ContactInfo[]}
 */
const contactInfo = [
    {
        icon: Mail,
        text: 'services@scoopify.club',
        href: 'mailto:services@scoopify.club',
    },
    {
        icon: Phone,
        text: '(555) 123-4567',
        href: 'tel:5551234567',
    },
    {
        icon: MapPin,
        text: 'Colorado Springs & Falcon, CO',
        href: '/contact',
    },
];

/**
 * Social media links
 * @type {SocialLink[]}
 */
const socialLinks = [
    { name: 'Facebook', icon: Facebook, href: '#' },
    { name: 'Twitter', icon: Twitter, href: '#' },
    { name: 'Instagram', icon: Instagram, href: '#' },
];

/**
 * Footer component for the application
 * @returns {JSX.Element} The rendered component
 */
export default function Footer() {
    return (<footer className="bg-[color:var(--brand-surface)] border-t border-[color:var(--brand-line)]">
      <div className="mx-auto max-w-7xl overflow-hidden px-6 py-16 sm:py-20 lg:px-8">
        <div className="flex justify-center mb-10">
          <Logo size="sm" href="/" />
        </div>
        <nav className="-mb-6 columns-2 sm:flex sm:justify-center sm:space-x-12" aria-label="Footer">
          {navigation.main.map((item) => (<div key={item.name} className="pb-6">
              <Link href={item.href} className="text-sm leading-6 text-[color:var(--brand-ink-muted)] hover:text-[color:var(--brand-leaf)]" data-testid={`footer-${item.name.toLowerCase()}`}>
                {item.name}
              </Link>
            </div>))}
          <div className="pb-6">
            <Link href="/business-signup" className="text-sm leading-6 text-[color:var(--brand-leaf)] hover:text-[color:var(--brand-leaf-deep)] font-semibold" data-testid="footer-business-partner-signup">
              Business Partner Signup
            </Link>
          </div>
        </nav>
        <div className="mt-10 flex justify-center space-x-10">
          {navigation.legal.map((item) => (<Link key={item.name} href={item.href} className="text-sm leading-6 text-[color:var(--brand-ink-muted)] hover:text-[color:var(--brand-leaf)]" data-testid={`footer-${item.name.toLowerCase()}`}>
              {item.name}
            </Link>))}
        </div>
        <p className="mt-10 text-center text-xs leading-5 text-[color:var(--brand-ink-muted)]">
          &copy; {new Date().getFullYear()} Scoopify Club. All rights reserved.
          {' '}Pilot: Colorado Springs &amp; Falcon, CO · services@scoopify.club
        </p>
      </div>
    </footer>);
}
