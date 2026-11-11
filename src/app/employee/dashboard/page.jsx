"use client";
// Trigger new Vercel deployment - fix skeleton component
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import JobPool from './components/JobPool';
import { ServiceAreaManager } from './components/ServiceAreaManager';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';

// Add error boundary component
function ErrorBoundary({ children, fallback }) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleError = (error) => {
      console.error('Dashboard error:', error);
      setError(error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return fallback || (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error?.message || 'Something went wrong. Please try refreshing the page.'}
        </AlertDescription>
        <Button 
          variant="outline" 
          className="mt-2"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Page
        </Button>
      </Alert>
    );
  }

  return children;
}

// Add loading skeleton component
function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-10" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="h-12 w-12 rounded-full" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function EmployeeDashboard() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000;

    // Check authentication using cookie-based API
    const checkAuth = async () => {
        try {
            const response = await fetch('/api/auth/me', {
                credentials: 'include',
            });
            
            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
                
                // Check if user is employee
                if (data.user?.role !== 'EMPLOYEE') {
                    router.push('/auth/signin');
                    return;
                }
            } else {
                router.push('/auth/signin');
                return;
            }
        } catch (error) {
            router.push('/auth/signin');
            return;
        } finally {
            setAuthLoading(false);
        }
    };

    // Fetch dashboard data
    const fetchDashboardData = async () => {
        if (!user?.id) {
            return;
        }
        
        setIsLoading(true);
        
        try {
            const response = await fetch('/api/employee/dashboard', {
                credentials: 'include',
            });
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            
            const data = await response.json();
            
            setDashboardData(data);
            setError(null);
            setRetryCount(0);
        } catch (err) {
            setError(err.message);
            
            // Auto-retry logic
            if (retryCount < MAX_RETRIES) {
                setTimeout(() => {
                    setRetryCount(prev => prev + 1);
                    fetchDashboardData();
                }, RETRY_DELAY);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Check auth on mount
    useEffect(() => {
        checkAuth();
    }, []);

    // Fetch data when user is available
    useEffect(() => {
        if (!authLoading && user) {
            fetchDashboardData();
        }
    }, [user, authLoading]);

    // Show loading state while checking auth or fetching data
    if (authLoading || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-lg">Loading your dashboard...</p>
                    <p className="text-sm text-gray-500">
                        {authLoading ? 'Checking authentication...' : 'Loading dashboard data...'}
                    </p>
                </div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <Alert variant="destructive" className="m-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Loading Dashboard</AlertTitle>
                <AlertDescription>
                    {error}
                    {retryCount > 0 && (
                        <div className="mt-2">
                            Retried {retryCount}/{MAX_RETRIES} times
                        </div>
                    )}
                </AlertDescription>
                <Button 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => {
                        setError(null);
                        setRetryCount(0);
                        fetchDashboardData();
                    }}
                >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                </Button>
            </Alert>
        );
    }

    // Main dashboard content — lean pilot: jobs first, no customer messaging/CRM
    const displayName = user?.firstName || user?.name || 'Scooper';
    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold">Welcome, {displayName}</h1>
                    <p className="text-gray-600 mt-1">
                        Claim a job, confirm arrival, upload one cleanup photo, complete. Customer email stays with admins.
                    </p>
                </div>
                <Button onClick={() => router.push('/employee/dashboard/services')}>
                    My claimed jobs
                </Button>
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-4">Available Jobs</h2>
                <div className="bg-white rounded-lg border shadow-sm">
                    <div className="p-4 sm:p-6">
                        <JobPool employeeId={user?.id} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-2">Coverage ZIPs</h3>
                    {dashboardData?.stats?.serviceAreas?.length > 0 ? (
                        <div className="space-y-2">
                            {dashboardData.stats.serviceAreas.map((area, index) => (
                                <div key={area.id || index} className="bg-gray-50 p-3 rounded text-sm">
                                    <strong>ZIP:</strong> {area.zipCode}
                                    <span className={`ml-2 px-2 py-0.5 rounded text-xs ${area.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {area.active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm">No service areas configured yet.</p>
                    )}
                </Card>
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-2">Completed</h3>
                    <p className="text-3xl font-bold">{dashboardData?.stats?.completedServices || 0}</p>
                    <p className="text-sm text-gray-500 mt-1">Jobs finished</p>
                </Card>
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-4">Service area</h2>
                <div className="bg-white rounded-lg border shadow-sm">
                    <div className="p-4 sm:p-6">
                        <ServiceAreaManager employeeId={user?.id} />
                    </div>
                </div>
            </div>
        </div>
    );
}
