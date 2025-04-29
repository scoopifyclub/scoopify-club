'use client';

import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';

/**
 * @typedef {Object} MainLayoutProps
 * @property {React.ReactNode} children - The content to render inside the layout
 */

/**
 * Main layout component that wraps the application content
 * @param {MainLayoutProps} props - Component props
 * @returns {JSX.Element} The MainLayout component
 */
export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
} 