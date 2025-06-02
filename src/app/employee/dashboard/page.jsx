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

    console.log('🚀 Employee Dashboard component loaded');
    console.log('👤 User:', user);
    console.log('🔄 Loading states - auth:', loading, 'dashboard:', isLoading);

    // Set isClient to true on mount and initialize date
    useEffect(() => {
        setIsClient(true);
        setCurrentDate(format(new Date(), 'MMMM d, yyyy'));
    }, []);

    // Fetch all dashboard data
    const fetchDashboardData = async () => {
        console.log('🔄 fetchDashboardData called');
        if (!user?.id) {
            console.log('❌ No user ID, skipping fetch');
            return;
        }
        
        console.log('📡 Starting API call...');
        setIsLoading(true);
        
        try {
            const response = await fetch('/api/employee/dashboard', {
                credentials: 'include',
            });
            
            console.log('📡 API Response:', response.status);
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ Data received:', data);
            
            setDashboardData(data);
            setError(null);
        } catch (err) {
            console.error('❌ API Error:', err);
            setError(err.message);
            retryFetch(() => fetchDashboardData(), 'dashboard');
        } finally {
            console.log('🏁 Setting loading to false');
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
        console.log('📍 useEffect triggered - loading:', loading, 'user:', !!user);
        if (!loading && user) {
            fetchDashboardData();
        }
    }, [user, loading]);

    console.log('🎨 About to render - loading:', loading, 'isLoading:', isLoading, 'error:', error, 'data:', !!dashboardData);

    // Show loading state
    if (loading || isLoading) {
        console.log('🔄 Rendering loading...');
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-lg">Loading your dashboard...</p>
                    <p className="text-sm text-gray-500">Auth loading: {loading ? 'yes' : 'no'}, Dashboard loading: {isLoading ? 'yes' : 'no'}</p>
                </div>
            </div>
        );
    }

    // Show error state
    if (error) {
        console.log('❌ Rendering error:', error);
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center text-red-600">
                    <h2 className="text-xl font-bold">Error Loading Dashboard</h2>
                    <p>{error}</p>
                    <button 
                        onClick={fetchDashboardData}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    console.log('✅ Rendering main dashboard');

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
