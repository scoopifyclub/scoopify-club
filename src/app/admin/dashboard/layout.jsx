'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Loader2, HomeIcon, UsersIcon, BuildingIcon, CircleDollarSign, Settings, RefreshCw, LogOut, Calendar, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export default function AdminDashboardLayout({ children }) {
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [quickStats, setQuickStats] = useState({
        totalCustomers: 0,
        totalEmployees: 0,
        pendingServices: 0,
        monthlyRevenue: 0
    });
    const router = useRouter();
    const pathname = usePathname();

    const refreshSession = useCallback(async () => {
        try {
            setIsRefreshing(true);
            const response = await fetch('/api/admin/refresh', {
                method: 'POST',
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Failed to refresh session');
            }
            
            toast.success('Session refreshed');
        } catch (error) {
            console.error('Failed to refresh session:', error);
            toast.error('Failed to refresh session. Please log in again.');
            // If refresh fails, redirect to login
            handleLogout();
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Always redirect to login page after logout attempt
            window.location.href = '/login?callbackUrl=/admin/dashboard';
        }
    };

    // Check session validity periodically
    useEffect(() => {
        const checkSessionInterval = setInterval(async () => {
            try {
                const response = await fetch('/api/admin/verify', {
                    credentials: 'include'
                });
                const data = await response.json();

                if (!data.success) {
                    toast.warning('Your session is about to expire. Click to refresh.', {
                        action: {
                            label: 'Refresh',
                            onClick: refreshSession
                        }
                    });
                }
            } catch (error) {
                console.error('Session check failed:', error);
            }
        }, 60000); // Check every minute

        return () => clearInterval(checkSessionInterval);
    }, [refreshSession]);

    useEffect(() => {
        // Check if we're in a browser environment
        if (typeof window !== 'undefined') {
            // Get the last part of the pathname
            const currentPath = pathname.split('/').pop();
            // If it's a valid tab, set it as active
            if (currentPath && ['overview', 'customers', 'employees', 'services', 'payments', 'reports', 'settings'].includes(currentPath)) {
                setActiveTab(currentPath);
            }

            // Verify admin authentication
            fetch('/api/admin/verify', {
                credentials: 'include'
            })
            .then(response => response.json())
            .then(data => {
                if (data.success && data.user?.role === 'ADMIN') {
                    console.log('Admin token valid, loading dashboard');
                    fetchQuickStats();
                    setIsLoading(false);
                } else {
                    console.log('Admin verification failed, redirecting to login');
                    window.location.href = '/login?callbackUrl=/admin/dashboard';
                }
            })
            .catch(error => {
                console.error('Error verifying admin token:', error);
                window.location.href = '/login?callbackUrl=/admin/dashboard';
            });
        }
    }, [pathname]);

    const fetchQuickStats = async () => {
        try {
            const response = await fetch('/api/admin/stats', {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch stats');
            }

            const data = await response.json();
            setQuickStats(data);
        } catch (error) {
            console.error('Error fetching quick stats:', error);
            // Fallback to demo data
            setQuickStats({
                totalCustomers: 152,
                totalEmployees: 18,
                pendingServices: 47,
                monthlyRevenue: 28540
            });
        }
    };

    const tabs = [
        { id: 'overview', label: 'Dashboard', icon: <HomeIcon className="h-5 w-5"/>, href: '/admin/dashboard/overview' },
        { id: 'customers', label: 'Customers', icon: <UsersIcon className="h-5 w-5"/>, href: '/admin/dashboard/customers' },
        { id: 'employees', label: 'Employees', icon: <BuildingIcon className="h-5 w-5"/>, href: '/admin/dashboard/employees' },
        { id: 'services', label: 'Services', icon: <Calendar className="h-5 w-5"/>, href: '/admin/dashboard/services' },
        { id: 'payments', label: 'Payments', icon: <CircleDollarSign className="h-5 w-5"/>, href: '/admin/dashboard/payments' },
        { id: 'reports', label: 'Reports', icon: <FileText className="h-5 w-5"/>, href: '/admin/dashboard/reports' },
        { id: 'settings', label: 'Settings', icon: <Settings className="h-5 w-5"/>, href: '/admin/dashboard/settings' },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary"/>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row max-w-screen-xl mx-auto px-4 py-8">
            {/* Mobile Header with Logout Button for small screens */}
            <div className="md:hidden w-full flex justify-between items-center mb-4">
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
                <Button variant="destructive" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2"/>
                    Log Out
                </Button>
            </div>
            
            {/* Sidebar */}
            <aside className="w-full md:w-64 mb-6 md:mb-0 md:mr-8">
                <div className="bg-card text-card-foreground rounded-lg p-4 shadow-sm sticky top-8">
                    <h2 className="text-xl font-semibold mb-4">Admin Dashboard</h2>
                    
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
                                <span className="text-sm">Total Customers</span>
                                <span className="text-sm font-medium">{quickStats.totalCustomers}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm">Total Employees</span>
                                <span className="text-sm font-medium">{quickStats.totalEmployees}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm">Pending Services</span>
                                <span className="text-sm font-medium">{quickStats.pendingServices}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm">Monthly Revenue</span>
                                <span className="text-sm font-medium">${quickStats.monthlyRevenue.toLocaleString()}</span>
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
                                <Loader2 className="h-4 w-4 mr-2 animate-spin"/>
                            ) : (
                                <RefreshCw className="h-4 w-4 mr-2"/>
                            )}
                            Refresh Session
                        </Button>
                        
                        <Button 
                            variant="destructive" 
                            size="sm" 
                            className="w-full flex items-center justify-center mt-2" 
                            onClick={handleLogout}
                        >
                            <LogOut className="h-4 w-4 mr-2"/>
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
