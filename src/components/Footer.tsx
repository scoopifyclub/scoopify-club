import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react'

const navigation = {
  company: [
    { name: 'About', href: '/about' },
    { name: 'Services', href: '/services' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Careers', href: '/careers' },
  ],
  support: [
    { name: 'Contact', href: '/contact' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Help Center', href: '/help' },
    { name: 'Service Areas', href: '/coverage' },
  ],
  legal: [
    { name: 'Privacy', href: '/privacy' },
    { name: 'Terms', href: '/terms' },
    { name: 'Cookie Policy', href: '/cookies' },
  ],
  social: [
    {
      name: 'Facebook',
      href: '#',
      icon: Facebook,
    },
    {
      name: 'Twitter',
      href: '#',
      icon: Twitter,
    },
    {
      name: 'Instagram',
      href: '#',
      icon: Instagram,
    },
  ],
}

const contactInfo = [
  {
    name: 'Email',
    value: 'hello@scoopify.club',
    icon: Mail,
  },
  {
    name: 'Phone',
    value: '(555) 123-4567',
    icon: Phone,
  },
  {
    name: 'Address',
    value: '123 Pet Care Way, Dogtown, CA 90210',
    icon: MapPin,
  },
]

export function Footer() {
  return (
    <footer className="bg-white">
      <div className="mx-auto max-w-7xl overflow-hidden px-6 py-20 sm:py-24 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-x-2">
              <Logo className="h-8 w-8" />
              <span className="text-xl font-bold text-neutral-900">
                Scoopify<span className="text-brand-primary">.club</span>
              </span>
            </div>
            <p className="mt-4 text-sm text-neutral-600">
              Professional dog waste removal service keeping your yard clean and your family safe.
            </p>
            <div className="mt-6 flex space-x-6">
              {navigation.social.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-neutral-400 hover:text-brand-primary"
                >
                  <span className="sr-only">{item.name}</span>
                  <item.icon className="h-6 w-6" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Company</h3>
            <ul className="mt-4 space-y-4">
              {navigation.company.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-neutral-600 hover:text-brand-primary"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Support</h3>
            <ul className="mt-4 space-y-4">
              {navigation.support.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-neutral-600 hover:text-brand-primary"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Contact Us</h3>
            <ul className="mt-4 space-y-4">
              {contactInfo.map((item) => (
                <li key={item.name} className="flex items-start">
                  <item.icon className="h-5 w-5 flex-shrink-0 text-neutral-400" />
                  <span className="ml-3 text-sm text-neutral-600">{item.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-neutral-200 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-4">
              {navigation.legal.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-sm text-neutral-600 hover:text-brand-primary"
                >
                  {item.name}
                </Link>
              ))}
            </nav>
            <p className="text-sm text-neutral-500">
              &copy; {new Date().getFullYear()} Scoopify Club. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
} 