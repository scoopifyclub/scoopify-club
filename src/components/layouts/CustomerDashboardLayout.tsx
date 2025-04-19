import { ReactNode } from 'react';
import { Navbar } from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { Home, Calendar, CreditCard, Settings, User } from 'lucide-react';

interface CustomerDashboardLayoutProps {
  children: ReactNode;
}

export function CustomerDashboardLayout({ children }: CustomerDashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Enhanced Sidebar */}
          <aside className="w-72 bg-white rounded-2xl shadow-lg p-6 h-fit border border-gray-100">
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 px-4 mb-2">Dashboard</h2>
              <div className="h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 mx-4 mb-6"></div>
            </div>
            <nav className="space-y-2">
              <Link 
                href="/dashboard" 
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-xl transition-all duration-200 group"
              >
                <Home className="w-5 h-5 mr-3 text-blue-500 group-hover:text-blue-600" />
                <span className="font-medium">Overview</span>
              </Link>
              <Link 
                href="/dashboard/services" 
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-xl transition-all duration-200 group"
              >
                <Calendar className="w-5 h-5 mr-3 text-blue-500 group-hover:text-blue-600" />
                <span className="font-medium">My Services</span>
              </Link>
              <Link 
                href="/dashboard/billing" 
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-xl transition-all duration-200 group"
              >
                <CreditCard className="w-5 h-5 mr-3 text-blue-500 group-hover:text-blue-600" />
                <span className="font-medium">Billing & Payments</span>
              </Link>
              <Link 
                href="/dashboard/profile" 
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-xl transition-all duration-200 group"
              >
                <User className="w-5 h-5 mr-3 text-blue-500 group-hover:text-blue-600" />
                <span className="font-medium">Profile Settings</span>
              </Link>
            </nav>
            
            {/* Quick Stats */}
            <div className="mt-8 p-4 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl text-white">
              <h3 className="text-sm font-semibold mb-3">Quick Stats</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-blue-100">Active Services</span>
                  <span className="font-semibold">3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-100">Next Service</span>
                  <span className="font-semibold">2d</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 space-y-8">
            {children}
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
} 