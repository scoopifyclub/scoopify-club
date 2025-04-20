'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Home, Calendar, Users, DollarSign, User, MapPin, MessageSquare, Bell, CheckSquare, Settings, Image } from 'lucide-react';

export default function EmployeeDashboardLayout({
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
      localStorage.setItem('employee_dashboard_active_tab', tab);
      
      // Use Next.js router for navigation
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', tab);
      router.push(`/employee/dashboard?${params.toString()}`);
    }
  };
  
  // Listen for tab changes
  useEffect(() => {
    // Get tab from URL params
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'schedule', 'customers', 'earnings', 'services', 'messages', 'notifications', 'checklists', 'photos', 'maps', 'settings', 'profile'].includes(tabParam)) {
      setActiveTab(tabParam);
    } else {
      // Fallback to localStorage
      const storedTab = localStorage.getItem('employee_dashboard_active_tab');
      if (storedTab && ['overview', 'schedule', 'customers', 'earnings', 'services', 'messages', 'notifications', 'checklists', 'photos', 'maps', 'settings', 'profile'].includes(storedTab)) {
        setActiveTab(storedTab);
        
        // Sync URL with stored tab if needed
        if (!tabParam) {
          const params = new URLSearchParams(searchParams.toString());
          params.set('tab', storedTab);
          router.replace(`/employee/dashboard?${params.toString()}`);
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
            <h2 className="text-lg font-semibold text-gray-800 px-4 mb-2">Scooper Dashboard</h2>
            <div className="h-0.5 bg-gradient-to-r from-green-500 to-blue-500 mx-4 mb-6"></div>
          </div>
          <nav className="space-y-2">
            <div className="text-xs font-semibold uppercase text-gray-500 px-4 mb-2">Main</div>
            <button 
              onClick={() => setDashboardTab('overview')}
              className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${
                activeTab === 'overview' 
                  ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white' 
                  : 'text-gray-700 hover:bg-green-50'
              }`}
            >
              <Home className={`w-5 h-5 mr-3 ${activeTab === 'overview' ? 'text-white' : 'text-green-500'}`} />
              <span className="font-medium">Overview</span>
            </button>
            <button 
              onClick={() => setDashboardTab('schedule')}
              className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${
                activeTab === 'schedule' 
                  ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white' 
                  : 'text-gray-700 hover:bg-green-50'
              }`}
            >
              <Calendar className={`w-5 h-5 mr-3 ${activeTab === 'schedule' ? 'text-white' : 'text-green-500'}`} />
              <span className="font-medium">My Schedule</span>
            </button>
            <button 
              onClick={() => setDashboardTab('services')}
              className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${
                activeTab === 'services' 
                  ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white' 
                  : 'text-gray-700 hover:bg-green-50'
              }`}
            >
              <CheckSquare className={`w-5 h-5 mr-3 ${activeTab === 'services' ? 'text-white' : 'text-green-500'}`} />
              <span className="font-medium">Services</span>
            </button>
            <button 
              onClick={() => setDashboardTab('customers')}
              className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${
                activeTab === 'customers' 
                  ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white' 
                  : 'text-gray-700 hover:bg-green-50'
              }`}
            >
              <Users className={`w-5 h-5 mr-3 ${activeTab === 'customers' ? 'text-white' : 'text-green-500'}`} />
              <span className="font-medium">My Customers</span>
            </button>
            <button 
              onClick={() => setDashboardTab('earnings')}
              className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${
                activeTab === 'earnings' 
                  ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white' 
                  : 'text-gray-700 hover:bg-green-50'
              }`}
            >
              <DollarSign className={`w-5 h-5 mr-3 ${activeTab === 'earnings' ? 'text-white' : 'text-green-500'}`} />
              <span className="font-medium">Earnings</span>
            </button>
            
            <div className="text-xs font-semibold uppercase text-gray-500 px-4 mt-6 mb-2">Tools</div>
            <button 
              onClick={() => setDashboardTab('maps')}
              className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${
                activeTab === 'maps' 
                  ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white' 
                  : 'text-gray-700 hover:bg-green-50'
              }`}
            >
              <MapPin className={`w-5 h-5 mr-3 ${activeTab === 'maps' ? 'text-white' : 'text-green-500'}`} />
              <span className="font-medium">Maps & Routes</span>
            </button>
            <button 
              onClick={() => setDashboardTab('messages')}
              className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${
                activeTab === 'messages' 
                  ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white' 
                  : 'text-gray-700 hover:bg-green-50'
              }`}
            >
              <MessageSquare className={`w-5 h-5 mr-3 ${activeTab === 'messages' ? 'text-white' : 'text-green-500'}`} />
              <span className="font-medium">Messages</span>
            </button>
            <button 
              onClick={() => setDashboardTab('photos')}
              className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${
                activeTab === 'photos' 
                  ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white' 
                  : 'text-gray-700 hover:bg-green-50'
              }`}
            >
              <Image className={`w-5 h-5 mr-3 ${activeTab === 'photos' ? 'text-white' : 'text-green-500'}`} />
              <span className="font-medium">Service Photos</span>
            </button>
            <button 
              onClick={() => setDashboardTab('notifications')}
              className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${
                activeTab === 'notifications' 
                  ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white' 
                  : 'text-gray-700 hover:bg-green-50'
              }`}
            >
              <Bell className={`w-5 h-5 mr-3 ${activeTab === 'notifications' ? 'text-white' : 'text-green-500'}`} />
              <span className="font-medium">Notifications</span>
            </button>
            
            <div className="text-xs font-semibold uppercase text-gray-500 px-4 mt-6 mb-2">Account</div>
            <button 
              onClick={() => setDashboardTab('profile')}
              className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${
                activeTab === 'profile' 
                  ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white' 
                  : 'text-gray-700 hover:bg-green-50'
              }`}
            >
              <User className={`w-5 h-5 mr-3 ${activeTab === 'profile' ? 'text-white' : 'text-green-500'}`} />
              <span className="font-medium">Profile</span>
            </button>
            <button 
              onClick={() => setDashboardTab('settings')}
              className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${
                activeTab === 'settings' 
                  ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white' 
                  : 'text-gray-700 hover:bg-green-50'
              }`}
            >
              <Settings className={`w-5 h-5 mr-3 ${activeTab === 'settings' ? 'text-white' : 'text-green-500'}`} />
              <span className="font-medium">Settings</span>
            </button>
          </nav>
          
          {/* Quick Stats */}
          <div className="mt-8 p-4 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl text-white">
            <h3 className="text-sm font-semibold mb-3">Quick Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-green-100">Active Jobs</span>
                <span className="font-semibold">5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-100">Next Service</span>
                <span className="font-semibold">Today, 2 PM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-100">Earnings This Week</span>
                <span className="font-semibold">$320</span>
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