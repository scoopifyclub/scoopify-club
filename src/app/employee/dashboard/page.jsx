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

export default function EmployeeDashboard() {
    // --- Notification badge state ---
    const [unreadCount, setUnreadCount] = useState(0);
    const [notificationSettings, setNotificationSettings] = useState(null);
    const router = useRouter();
    const { user, loading } = useAuth();
    const [services, setServices] = useState([]);
    const [loadingServices, setLoadingServices] = useState(true);
    const [error, setError] = useState(null);

    const [stats, setStats] = useState({
        totalServices: 0,
        completedServices: 0,
        earnings: 0,
        customerCount: 0
    });

    const [employeeData, setEmployeeData] = useState(null);
    const [isClient, setIsClient] = useState(false);
    const [currentDate, setCurrentDate] = useState('');
    const [statsLoading, setStatsLoading] = useState(true);

    // Set isClient to true on mount and initialize date
    useEffect(() => {
        setIsClient(true);
        setCurrentDate(format(new Date(), 'MMMM d, yyyy'));
    }, []);

    useEffect(() => {
        if (user && user.role === 'EMPLOYEE') {
            fetchServices();
        }
    }, [user]);

    const fetchServices = async () => {
        try {
            const response = await fetch('/api/employee/services', {
                credentials: 'include',
            });
            if (!response.ok) {
                throw new Error('Failed to fetch services');
            }
            const data = await response.json();
            setServices(data);
        } catch (error) {
            setError(error.message);
            toast.error('Failed to load services');
        } finally {
            setLoadingServices(false);
        }
    };

    const handleClaimService = async (serviceId) => {
        try {
            const response = await fetch(`/api/employee/services/${serviceId}/claim`, {
                method: 'POST',
                credentials: 'include',
            });
            if (!response.ok) {
                throw new Error('Failed to claim service');
            }
            toast.success('Service claimed successfully');
            fetchServices(); // Refresh the list
        } catch (error) {
            toast.error('Failed to claim service');
        }
    };



    // Header with notifications dropdown
    const header = (
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Employee Dashboard</h1>
          <div className="text-gray-500 text-sm">{currentDate}</div>
        </div>
        <NotificationsDropdown userType="scooper" />
      </div>
    );

    const [onboardingState, setOnboardingState] = useState({ hasSetServiceArea: false, serviceAreas: [] });
    useEffect(() => {
        if (user?.id) {
            fetchEmployeeStats();
        }
    }, [user]);

    const fetchEmployeeStats = async () => {
        setStatsLoading(true);
        try {
            const response = await fetch('/api/employee/stats', { credentials: 'include' });
            if (response.ok) {
                const data = await response.json();
                setStats({
                    totalServices: data.totalServices,
                    completedServices: data.completedServices,
                    earnings: data.earnings,
                    customerCount: data.customerCount
                });
                setOnboardingState({
                    hasSetServiceArea: data.hasSetServiceArea,
                    serviceAreas: data.serviceAreas || []
                });
            }
        } catch (error) {
            console.error('Failed to fetch employee stats:', error);
        }
        setStatsLoading(false);
    };

    // Show onboarding block if not set
    if (!statsLoading && (!onboardingState.hasSetServiceArea || onboardingState.serviceAreas.length === 0)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <h2 className="text-2xl font-bold mb-4">Complete Your Onboarding</h2>
                <p className="mb-6 text-gray-600">You must set up at least one active service area before you can access your dashboard.</p>
                <div className="w-full max-w-md">
                    <ServiceAreaManager employeeId={user.id} onOnboardingComplete={fetchEmployeeStats} />
                </div>
            </div>
        );
    }

    if (loading || loadingServices) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (!user || user.role !== 'EMPLOYEE') {
        return <div>Access denied. Employee access only.</div>;
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <NotificationSettings onChange={setNotificationSettings} />
                <Notifications 
                  onUnreadCountChange={setUnreadCount} 
                  employeeId={user.id} 
                  settings={notificationSettings} 
                />
            </div>
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                Welcome back, {user?.name || 'Employee'}
                {unreadCount > 0 && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                        {unreadCount} unread
                    </span>
                )}
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Services</p>
                            <h3 className="text-2xl font-bold">{stats.totalServices}</h3>
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
                            <h3 className="text-2xl font-bold">{stats.completedServices}</h3>
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
                            <h3 className="text-2xl font-bold">${stats.earnings.toFixed(2)}</h3>
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
                            <h3 className="text-2xl font-bold">{stats.customerCount}</h3>
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
            {employeeData && (
                <PaymentInfoReminder
                    userType="employee"
                    hasPaymentInfo={employeeData.hasPaymentInfo}
                    hasPaymentMethod={employeeData.hasPaymentMethod}
                    preferredMethodSelected={employeeData.preferredMethodSelected}
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

            {/* Notifications Section */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Notifications</h2>
              <Notifications employeeId={user.id} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Upcoming Services</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[400px]">
                        {loadingServices ? (
                            <div className="animate-pulse space-y-2">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="h-16 bg-gray-100 rounded" />
                                ))}
                            </div>
                        ) : services.length === 0 ? (
                            <p className="text-center text-gray-500">No upcoming services</p>
                        ) : (
                            <div className="space-y-4">
                                {services.map((service) => (
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
    );
}

function DashboardSkeleton() {
    return (
        <div className="p-6">
            <Skeleton className="h-8 w-64 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-6 w-16" />
                            </div>
                            <Skeleton className="h-12 w-12 rounded-full" />
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
