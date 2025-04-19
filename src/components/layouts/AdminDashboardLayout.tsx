import { ReactNode } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';

interface AdminDashboardLayoutProps {
  children: ReactNode;
}

export function AdminDashboardLayout({ children }: AdminDashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-64 bg-white rounded-lg shadow-sm p-4 h-fit">
            <nav className="space-y-2">
              <Link 
                href="/admin/dashboard" 
                className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-md"
              >
                Overview
              </Link>
              <Link 
                href="/admin/customers" 
                className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-md"
              >
                Customers
              </Link>
              <Link 
                href="/admin/employees" 
                className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-md"
              >
                Employees
              </Link>
              <Link 
                href="/admin/services" 
                className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-md"
              >
                Services
              </Link>
              <Link 
                href="/admin/payments" 
                className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-md"
              >
                Payments
              </Link>
              <Link 
                href="/admin/settings" 
                className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-md"
              >
                Settings
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