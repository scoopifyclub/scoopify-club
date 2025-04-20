'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Loader2, HomeIcon, CalendarIcon, MessageSquare, CircleDollarSign, Settings, Briefcase, RefreshCw, LogOut, ShoppingBag } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface QuickStats {
  activeJobs: number;
  completedToday: number;
  earningsToday: number;
}

export default function EmployeeDashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status, update } = useSession();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [quickStats, setQuickStats] = useState<QuickStats>({
    activeJobs: 0,
    completedToday: 0,
    earningsToday: 0
  });
  const router = useRouter();
  const pathname = usePathname();

  const refreshSession = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await update(); // Update session data
      toast.success('Session refreshed');
    } catch (error) {
      console.error('Failed to refresh session:', error);
      toast.error('Failed to refresh session. Please log in again.');
      // If refresh fails, redirect to login
      signOut({ callbackUrl: '/login?callbackUrl=/employee/dashboard' });
    } finally {
      setIsRefreshing(false);
    }
  }, [update]);

  // Check session validity periodically
  useEffect(() => {
    const checkSessionInterval = setInterval(() => {
      if (status === 'authenticated' && session) {
        // Check if session is about to expire (e.g., in 5 minutes)
        // This is a simplified example - in real app, you'd check actual expiry
        const expiryCheck = new Date();
        expiryCheck.setMinutes(expiryCheck.getMinutes() + 5);
        
        // If session has expiry information and is about to expire
        if (session.expires && new Date(session.expires) < expiryCheck) {
          toast.warning('Your session is about to expire. Click to refresh.', {
            action: {
              label: 'Refresh',
              onClick: refreshSession
            }
          });
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkSessionInterval);
  }, [session, status, refreshSession]);

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      // Get the last part of the pathname
      const currentPath = pathname.split('/').pop();
      // If it's a valid tab, set it as active
      if (currentPath && ['overview', 'schedule', 'jobs', 'messages', 'earnings', 'settings', 'marketing'].includes(currentPath)) {
        setActiveTab(currentPath);
      }

      // Check authentication status
      if (status === 'loading') return;
      
      if (status === 'unauthenticated') {
        router.push('/login?callbackUrl=/employee/dashboard');
        return;
      }
      
      if (status === 'authenticated') {
        // Check if user is an employee
        if (session?.user?.role !== 'EMPLOYEE') {
          router.push('/');
          return;
        }
        fetchQuickStats();
        setIsLoading(false);
      }
    }
  }, [pathname, router, session, status]);

  const fetchQuickStats = async () => {
    try {
      // In a real app, fetch from API
      // For demo purposes, using mock data
      setQuickStats({
        activeJobs: 3,
        completedToday: 2,
        earningsToday: 120
      });
    } catch (error) {
      console.error('Error fetching quick stats:', error);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <HomeIcon className="h-5 w-5" />, href: '/employee/dashboard/overview' },
    { id: 'schedule', label: 'Schedule', icon: <CalendarIcon className="h-5 w-5" />, href: '/employee/dashboard/schedule' },
    { id: 'jobs', label: 'Available Jobs', icon: <Briefcase className="h-5 w-5" />, href: '/employee/dashboard/jobs' },
    { id: 'messages', label: 'Messages', icon: <MessageSquare className="h-5 w-5" />, href: '/employee/dashboard/messages' },
    { id: 'earnings', label: 'Earnings', icon: <CircleDollarSign className="h-5 w-5" />, href: '/employee/dashboard/earnings' },
    { id: 'marketing', label: 'Marketing Materials', icon: <ShoppingBag className="h-5 w-5" />, href: '/employee/dashboard/marketing' },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-5 w-5" />, href: '/employee/dashboard/settings' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row max-w-screen-xl mx-auto px-4 py-8">
      {/* Mobile Header with Logout Button for small screens */}
      <div className="md:hidden w-full flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Employee Dashboard</h1>
        <Button 
          variant="destructive" 
          size="sm"
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Log Out
        </Button>
      </div>
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 mb-6 md:mb-0 md:mr-8">
        <div className="bg-card text-card-foreground rounded-lg p-4 shadow-sm sticky top-8">
          <h2 className="text-xl font-semibold mb-4">Employee Dashboard</h2>
          
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <Link
                key={tab.id}
                href={tab.href}
                className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                <span className="ml-3">{tab.label}</span>
              </Link>
            ))}
          </nav>

          <div className="mt-8">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Quick Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Active Jobs</span>
                <span className="text-sm font-medium">{quickStats.activeJobs}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Completed Today</span>
                <span className="text-sm font-medium">{quickStats.completedToday}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Earnings Today</span>
                <span className="text-sm font-medium">${quickStats.earningsToday}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full flex items-center justify-center"
              onClick={refreshSession}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh Session
            </Button>
            
            <Button 
              variant="destructive" 
              size="sm" 
              className="w-full flex items-center justify-center mt-2"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Log Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-[calc(100vh-4rem)]">
        {children}
      </main>
    </div>
  );
} 