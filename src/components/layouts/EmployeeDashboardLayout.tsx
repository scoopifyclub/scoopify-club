import { ReactNode } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';

interface EmployeeDashboardLayoutProps {
  children: ReactNode;
}

export function EmployeeDashboardLayout({ children }: EmployeeDashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-64 bg-white rounded-lg shadow-sm p-4 h-fit">
            <nav className="space-y-2">
              <Link 
                href="/employee/dashboard" 
                className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-md"
              >
                Overview
              </Link>
              <Link 
                href="/employee/schedule" 
                className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-md"
              >
                My Schedule
              </Link>
              <Link 
                href="/employee/customers" 
                className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-md"
              >
                My Customers
              </Link>
              <Link 
                href="/employee/earnings" 
                className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-md"
              >
                Earnings
              </Link>
              <Link 
                href="/employee/profile" 
                className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-md"
              >
                Profile Settings
              </Link>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
} 