"use client";
// Trigger new Vercel deployment - fix skeleton component
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faCalendarAlt, faDollarSign, faUsers } from '@fortawesome/free-solid-svg-icons';
import PaymentInfoReminder from '@/components/PaymentInfoReminder';
import { format } from 'date-fns';
import { JobPool } from './components/JobPool';
import { JobPoolSocket } from './components/JobPoolSocket';
import { ServiceAreaManager } from './components/ServiceAreaManager';
import { EarningsCalculator } from './components/EarningsCalculator';
import { ServiceHistory } from './components/ServiceHistory';
import { Notifications } from './components/Notifications';
import { NotificationSettings } from './components/NotificationSettings';
import NotificationsDropdown from '@/components/NotificationsDropdown';
import ScooperRatings from '@/components/ScooperRatings';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'react-hot-toast';
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
    const { user, loading } = useAuth();
    const [dashboardData, setDashboardData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isRetrying, setIsRetrying] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [isClient, setIsClient] = useState(false);
    const [currentDate, setCurrentDate] = useState('');
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000; // 2 seconds

    // Set isClient to true on mount and initialize date
    useEffect(() => {
        setIsClient(true);
        setCurrentDate(format(new Date(), 'MMMM d, yyyy'));
    }, []);

    // Fetch all dashboard data
    const fetchDashboardData = async () => {
        if (!user?.id) {
            console.log('❌ fetchDashboardData: No user ID');
            return;
        }
        
        console.log('🔄 fetchDashboardData: Starting fetch for user:', user.id);
        setIsLoading(true);
        try {
            setError(null);
            console.log('📡 Making API call to /api/employee/dashboard');
            const response = await fetch('/api/employee/dashboard', {
                credentials: 'include',
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });
            
            console.log('📡 API response status:', response.status);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to fetch dashboard data: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ Dashboard data received:', data);
            setDashboardData(data);
            console.log('✅ Dashboard data set in state');
        } catch (error) {
            console.error('❌ Error fetching dashboard data:', error);
            setError(error.message);
            retryFetch(() => fetchDashboardData(), 'dashboard');
        } finally {
            console.log('🏁 fetchDashboardData: Setting isLoading to false');
            setIsLoading(false);
        }
    };

    // Retry logic for failed API calls
    const retryFetch = async (fetchFn, retryKey) => {
        if (retryCount >= MAX_RETRIES) {
            setError(`Failed to load ${retryKey} after ${MAX_RETRIES} attempts`);
            return;
        }

        setIsRetrying(true);
        try {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            await fetchFn();
            setRetryCount(0); // Reset retry count on success
        } catch (error) {
            setRetryCount(prev => prev + 1);
            console.error(`Retry ${retryCount + 1} failed for ${retryKey}:`, error);
        } finally {
            setIsRetrying(false);
        }
    };

    // Fetch data when user is available
    useEffect(() => {
        if (!loading && user) {
            fetchDashboardData();
        }
    }, [user, loading]);

    // Show loading state
    if (loading || isLoading) {
        console.log('🔄 Rendering loading state - auth loading:', loading, 'dashboard loading:', isLoading);
        return <DashboardSkeleton />;
    }

    // Show error state
    if (error) {
        console.log('❌ Rendering error state:', error);
        return (
            <Alert variant="destructive" className="m-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Loading Dashboard</AlertTitle>
                <AlertDescription>
                    {error}
                    {isRetrying && (
                        <div className="mt-2">
                            Retrying... ({retryCount + 1}/{MAX_RETRIES})
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
                    disabled={isRetrying}
                >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                </Button>
            </Alert>
        );
    }

    console.log('✅ Rendering main dashboard - dashboardData:', dashboardData ? 'present' : 'null');

    // Show onboarding block if needed - TEMPORARILY DISABLED for debugging
    // if (!dashboardData?.stats.hasSetServiceArea || dashboardData?.stats.serviceAreas.length === 0) {
    //     return (
    //         <div className="flex flex-col items-center justify-center min-h-screen">
    //             <h2 className="text-2xl font-bold mb-4">Complete Your Onboarding</h2>
    //             <p className="mb-6 text-gray-600">You must set up at least one active service area before you can access your dashboard.</p>
    //             <div className="w-full max-w-md">
    //                 <ServiceAreaManager 
    //                     employeeId={user.id} 
    //                     onOnboardingComplete={fetchDashboardData} 
    //                 />
    //             </div>
    //         </div>
    //     );
    // }

    // Main dashboard content
    return (
        <ErrorBoundary>
            <div className="p-6">
                <div className="mb-6">
                    <NotificationSettings 
                        onChange={(settings) => setDashboardData(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, settings }
                        }))}
                        settings={dashboardData?.notifications.settings}
                    />
                    <Notifications 
                        onUnreadCountChange={(count) => setDashboardData(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, unreadCount: count }
                        }))}
                        employeeId={user.id}
                        settings={dashboardData?.notifications.settings}
                        notifications={dashboardData?.notifications.recent}
                    />
                </div>

                <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    Welcome back, {user?.name || 'Employee'}
                    {dashboardData?.notifications.unreadCount > 0 && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                            {dashboardData.notifications.unreadCount} unread
                        </span>
                    )}
                </h1>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Services</p>
                                <h3 className="text-2xl font-bold">{dashboardData?.stats.totalServices}</h3>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <FontAwesomeIcon icon={faCalendarAlt} className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Completed Services</p>
                                <h3 className="text-2xl font-bold">{dashboardData?.stats.completedServices}</h3>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <FontAwesomeIcon icon={faMapMarkerAlt} className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                                <h3 className="text-2xl font-bold">${dashboardData?.stats.earnings.toFixed(2)}</h3>
                            </div>
                            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                                <FontAwesomeIcon icon={faDollarSign} className="h-6 w-6 text-yellow-600" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Customers Served</p>
                                <h3 className="text-2xl font-bold">{dashboardData?.stats.customerCount}</h3>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                <FontAwesomeIcon icon={faUsers} className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                        <div className="space-y-4">
                            <Button
                                onClick={() => router.push('/employee/dashboard/schedule')}
                                className="w-full justify-start"
                                variant="outline"
                            >
                                <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 h-4 w-4" />
                                View Schedule
                            </Button>
                            <Button
                                onClick={() => router.push('/employee/dashboard/services')}
                                className="w-full justify-start"
                                variant="outline"
                            >
                                <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 h-4 w-4" />
                                Active Services
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Payment Info Reminder */}
                {dashboardData && (
                    <PaymentInfoReminder
                        userType="employee"
                        hasPaymentInfo={dashboardData.hasPaymentInfo}
                        hasPaymentMethod={dashboardData.hasPaymentMethod}
                        preferredMethodSelected={dashboardData.preferredMethodSelected}
                    />
                )}

                {/* Job Pool Section */}
                <div className="mt-8">
                  <h2 className="text-xl font-semibold mb-4">Available Jobs</h2>
                  <JobPool employeeId={user.id} />
                </div>

                {/* Service Area Section */}
                <div className="mt-8">
                  <h2 className="text-xl font-semibold mb-4">Service Areas</h2>
                  <ServiceAreaManager employeeId={user.id} />
                </div>

                {/* Earnings Section */}
                <div className="mt-8">
                  <h2 className="text-xl font-semibold mb-4">Earnings</h2>
                  <EarningsCalculator employeeId={user.id} />
                </div>

                {/* Scooper Ratings Section */}
                <div className="mt-8">
                  <ScooperRatings employeeId={user.id} />
                </div>

                {/* Service History Section */}
                <div className="mt-8">
                  <h2 className="text-xl font-semibold mb-4">Service History</h2>
                  <ServiceHistory employeeId={user.id} />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Upcoming Services</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[400px]">
                            {isLoading ? (
                                <div className="animate-pulse space-y-2">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="h-16 bg-gray-100 rounded" />
                                    ))}
                                </div>
                            ) : dashboardData?.services.length === 0 ? (
                                <p className="text-center text-gray-500">No upcoming services</p>
                            ) : (
                                <div className="space-y-4">
                                    {dashboardData.services.map((service) => (
                                        <div key={service.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                                            <Avatar>
                                                <AvatarImage src={service.customer.avatar} />
                                                <AvatarFallback>
                                                    {service.customer.name?.charAt(0) || 'C'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <p className="font-medium">{service.customer.name}</p>
                                                <p className="text-sm text-gray-500">
                                                    {new Date(service.scheduledDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <Button variant="outline" size="sm">
                                                View Details
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </ErrorBoundary>
    );
}
