'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faCalendarAlt, faDollarSign, faUsers } from '@fortawesome/free-solid-svg-icons';
import PaymentInfoReminder from '@/components/PaymentInfoReminder';
import { format } from 'date-fns';

export default function EmployeeDashboard() {
    const router = useRouter();
    const { user, loading } = useAuth({
        required: true,
        role: 'EMPLOYEE',
        redirectTo: '/auth/signin'
    });

    const [stats, setStats] = useState({
        totalServices: 0,
        completedServices: 0,
        earnings: 0,
        customerCount: 0
    });

    const [employeeData, setEmployeeData] = useState(null);
    const [isClient, setIsClient] = useState(false);
    const [currentDate, setCurrentDate] = useState('');

    // Set isClient to true on mount and initialize date
    useEffect(() => {
        setIsClient(true);
        setCurrentDate(format(new Date(), 'MMMM d, yyyy'));
    }, []);

    // If not client-side yet, show loading state
    if (!isClient) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    useEffect(() => {
        if (user?.id) {
            fetchDashboardStats();
        }
    }, [user]);

    const fetchDashboardStats = async () => {
        try {
            const response = await fetch('/api/employee/dashboard/stats', {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Failed to fetch dashboard stats:', error);
        }
    };

    if (loading) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Welcome back, {user?.name || 'Employee'}</h1>
            
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
