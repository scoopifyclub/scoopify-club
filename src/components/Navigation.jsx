'use client';

import Link from 'next/link';
import { Logo } from '@/components/Logo';

export function Navigation() {
  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center">
            <Logo />
          </Link>
          
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard" 
              className="text-neutral-800 hover:text-brand-primary transition-colors duration-200"
            >
              Dashboard
            </Link>
            <Link 
              href="/book" 
              className="btn btn-primary"
            >
              Schedule Cleanup
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
