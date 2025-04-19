'use client';

import Link from 'next/link';
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Home', href: '/', icon: 'home' },
    { name: 'Services', href: '/services', icon: 'broom' },
    { name: 'Pricing', href: '/pricing', icon: 'tags' },
    { name: 'About', href: '/about', icon: 'info-circle' },
  ];

  return (
    <header className="bg-white border-b border-neutral-200">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="text-2xl font-bold flex items-center">
              <span className="inline-flex items-center justify-center w-8 h-8">
                <FontAwesomeIcon 
                  icon="paw"
                  className="text-primary-500"
                  width="32"
                  height="32"
                />
              </span>
              <span className="ml-3">Scoopify<span className="text-primary-500">Club</span></span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-neutral-700 hover:text-primary-500 font-medium transition-colors duration-200 flex items-center"
              >
                <span className="inline-flex items-center justify-center w-5 h-5">
                  <FontAwesomeIcon 
                    icon={item.icon}
                    width="20"
                    height="20"
                  />
                </span>
                <span className="ml-2">{item.name}</span>
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link 
              href="/auth/signin"
              className="text-neutral-700 hover:text-primary font-medium px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
            >
              <span className="inline-flex items-center justify-center w-5 h-5">
                <FontAwesomeIcon 
                  icon="sign-in-alt"
                  width="20"
                  height="20"
                />
              </span>
              <span className="ml-2">Log in</span>
            </Link>
            <Link 
              href="/signup"
              className="bg-primary text-white font-medium px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors duration-200 flex items-center"
            >
              <span className="inline-flex items-center justify-center w-5 h-5">
                <FontAwesomeIcon 
                  icon="user-plus"
                  width="20"
                  height="20"
                />
              </span>
              <span className="ml-2">Join the Club</span>
            </Link>
            <Link 
              href="/auth/scooper-signup"
              className="border-2 border-primary text-primary font-medium px-4 py-2 rounded-lg hover:bg-primary hover:text-white transition-colors duration-200 flex items-center"
            >
              <span className="inline-flex items-center justify-center w-5 h-5">
                <FontAwesomeIcon 
                  icon="broom"
                  width="20"
                  height="20"
                />
              </span>
              <span className="ml-2">Become a Scooper</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-neutral-700 hover:text-primary-500 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              <FontAwesomeIcon 
                icon={mobileMenuOpen ? 'times' : 'bars'}
                className="h-6 w-6"
              />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block px-3 py-2 rounded-md text-base font-medium text-neutral-700 hover:text-primary-500 hover:bg-neutral-100"
                >
                  <div className="flex items-center">
                    <span className="inline-flex items-center justify-center w-5 h-5 mr-2">
                      <FontAwesomeIcon 
                        icon={item.icon}
                        width="20"
                        height="20"
                      />
                    </span>
                    {item.name}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
} 