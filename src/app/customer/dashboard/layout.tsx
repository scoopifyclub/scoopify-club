'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Home, Calendar, CreditCard, User, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Function to set active tab and update URL
  const setDashboardTab = (tab: string) => {
    setActiveTab(tab);
    
    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard_active_tab', tab);
      
      // Use Next.js router for navigation
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', tab);
      router.push(`/customer/dashboard?${params.toString()}`);
    }
  };
  
  // Handle logout
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };
  
  // Listen for tab changes
  useEffect(() => {
    // Get tab from URL params
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'services', 'billing', 'profile'].includes(tabParam)) {
      setActiveTab(tabParam);
    } else {
      // Fallback to localStorage
      const storedTab = localStorage.getItem('dashboard_active_tab');
      if (storedTab && ['overview', 'services', 'billing', 'profile'].includes(storedTab)) {
        setActiveTab(storedTab);
        
        // Sync URL with stored tab if needed
        if (!tabParam) {
          const params = new URLSearchParams(searchParams.toString());
          params.set('tab', storedTab);
          router.replace(`/customer/dashboard?${params.toString()}`);
        }
      }
    }
  }, [searchParams, router]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="w-72 bg-white rounded-2xl shadow-lg p-6 h-fit border border-gray-100">
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 px-4 mb-2">Dashboard</h2>
            <div className="h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 mx-4 mb-6"></div>
          </div>
          <nav className="space-y-2">
            <button 
              onClick={() => setDashboardTab('overview')}
              className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${
                activeTab === 'overview' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
                  : 'text-gray-700 hover:bg-blue-50'
              }`}
            >
              <Home className={`w-5 h-5 mr-3 ${activeTab === 'overview' ? 'text-white' : 'text-blue-500'}`} />
              <span className="font-medium">Overview</span>
            </button>
            <button 
              onClick={() => setDashboardTab('services')}
              className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${
                activeTab === 'services' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
                  : 'text-gray-700 hover:bg-blue-50'
              }`}
            >
              <Calendar className={`w-5 h-5 mr-3 ${activeTab === 'services' ? 'text-white' : 'text-blue-500'}`} />
              <span className="font-medium">My Services</span>
            </button>
            <button 
              onClick={() => setDashboardTab('billing')}
              className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${
                activeTab === 'billing' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
                  : 'text-gray-700 hover:bg-blue-50'
              }`}
            >
              <CreditCard className={`w-5 h-5 mr-3 ${activeTab === 'billing' ? 'text-white' : 'text-blue-500'}`} />
              <span className="font-medium">Billing & Payments</span>
            </button>
            <button 
              onClick={() => setDashboardTab('profile')}
              className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${
                activeTab === 'profile' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
                  : 'text-gray-700 hover:bg-blue-50'
              }`}
            >
              <User className={`w-5 h-5 mr-3 ${activeTab === 'profile' ? 'text-white' : 'text-blue-500'}`} />
              <span className="font-medium">Profile Settings</span>
            </button>
            
            {/* Logout Button */}
            <div className="pt-4 mt-4 border-t border-gray-200">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-3 rounded-xl transition-colors text-gray-700 hover:bg-red-50"
              >
                <LogOut className="w-5 h-5 mr-3 text-red-500" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
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
        <main className="flex-1 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          {children}
        </main>
      </div>
    </div>
  );
} 