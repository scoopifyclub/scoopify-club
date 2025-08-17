'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpIcon, ArrowDownIcon, UsersIcon, CalendarIcon, CircleDollarSign, BarChart3, TrendingUp, AlertCircle, CheckIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function AdminOverviewPage() {
    const { user, status } = useAuth({ required: true, role: 'ADMIN', redirectTo: '/admin/login' });
    const router = useRouter();
    const [stats, setStats] = useState({
        totalCustomers: 0,
        totalEmployees: 0,
        totalServices: 0,
        totalRevenue: 0,
        activeServices: 0,
        pendingServices: 0,
        completedServices: 0,
        thisMonth: {
            newCustomers: 0,
            newServices: 0,
            revenue: 0
        }
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Move useEffect hook to the top before any early returns
    useEffect(() => {
        // Fetch dashboard data
        const fetchDashboardData = async () => {
            try {
                const response = await fetch('/api/admin/dashboard', {
                    credentials: 'include'
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || 'Failed to fetch dashboard data');
                }

                const data = await response.json();
                
                // The API now returns data directly without a stats wrapper
                setStats({
                    totalCustomers: data.overview?.totalCustomers || 0,
                    totalEmployees: data.overview?.totalEmployees || 0,
                    totalServices: data.overview?.totalServices || 0,
                    totalRevenue: data.overview?.totalRevenue || 0,
                    activeServices: data.overview?.activeServices || 0,
                    pendingServices: data.overview?.pendingServices || 0,
                    completedServices: data.overview?.completedServices || 0,
                    thisMonth: {
                        newCustomers: data.thisMonth?.newCustomers || 0,
                        newServices: data.thisMonth?.newServices || 0,
                        revenue: data.thisMonth?.revenue || 0
                    }
                });
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                toast.error('Failed to load dashboard data', {
                    description: error.message
                });
                // Set empty state instead of demo data
                setStats({
                    totalCustomers: 0,
                    totalEmployees: 0,
                    totalServices: 0,
                    totalRevenue: 0,
                    activeServices: 0,
                    pendingServices: 0,
                    completedServices: 0,
                    thisMonth: {
                        newCustomers: 0,
                        newServices: 0,
                        revenue: 0
                    }
                });
            } finally {
                setLoading(false);
            }
        };

        if (status === 'authenticated') {
            fetchDashboardData();
        }
    }, [status]);

    // Show loading state while auth is being checked
    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-lg">Loading admin dashboard...</p>
                </div>
            </div>
        );
    }

    // Redirect if not admin
    if (status === 'unauthenticated' || (user && user.role !== 'ADMIN')) {
        router.push('/admin/login');
        return null;
    }

    const completionRate = stats.completedServices > 0
        ? Math.round((stats.completedServices / stats.totalServices) * 100)
        : 0;

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'high':
                return 'bg-red-100 text-red-800';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800';
            case 'low':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getActivityIcon = (type) => {
        switch (type) {
            case 'service_completed':
                return <CalendarIcon className="h-5 w-5 text-green-500"/>;
            case 'payment_received':
                return <CircleDollarSign className="h-5 w-5 text-blue-500"/>;
            case 'customer_added':
                return <UsersIcon className="h-5 w-5 text-purple-500"/>;
            case 'service_scheduled':
                return <CalendarIcon className="h-5 w-5 text-indigo-500"/>;
            case 'payment_failed':
                return <CircleDollarSign className="h-5 w-5 text-red-500"/>;
            default:
                return <BarChart3 className="h-5 w-5 text-gray-500"/>;
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
                <p className="text-muted-foreground">
                    Welcome back, {user?.name || 'Admin'}! Here's what's happening with your business.
                </p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                        <UsersIcon className="h-4 w-4 text-muted-foreground"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalCustomers}</div>
                        <div className="flex items-center pt-1 text-xs text-muted-foreground">
                            {/* stats.customerChange is no longer available */}
                            <span className="ml-1">from last month</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                        <CircleDollarSign className="h-4 w-4 text-muted-foreground"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats.thisMonth.revenue.toLocaleString()}</div>
                        <div className="flex items-center pt-1 text-xs text-muted-foreground">
                            {/* stats.revenueChange is no longer available */}
                            <span className="ml-1">from last month</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Services</CardTitle>
                        <CalendarIcon className="h-4 w-4 text-muted-foreground"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeServices}</div>
                        <p className="text-xs text-muted-foreground pt-1">
                            {stats.completedServices} completed this month
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Service Completion</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{completionRate}%</div>
                        <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                            <div 
                                className="h-full bg-primary rounded-full" 
                                style={{ width: `${completionRate}%` }}
                            ></div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Latest actions and updates</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* stats.recentActivity is no longer available */}
                            <div className="flex items-start space-x-4">
                                <CalendarIcon className="h-5 w-5 text-green-500"/>
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        Service completed by John Doe
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        2023-10-27
                                    </p>
                                </div>
                                <Badge variant="outline">Completed</Badge>
                            </div>
                            <div className="flex items-start space-x-4">
                                <CircleDollarSign className="h-5 w-5 text-blue-500"/>
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        Payment received from Jane Smith
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        2023-10-26
                                    </p>
                                </div>
                                <Badge variant="outline">Success</Badge>
                            </div>
                            <div className="flex items-start space-x-4">
                                <UsersIcon className="h-5 w-5 text-purple-500"/>
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        New customer added: Sarah Johnson
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        2023-10-25
                                    </p>
                                </div>
                                <Badge variant="outline">New Customer</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Alerts */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>System Alerts</CardTitle>
                        <CardDescription>Important notifications and warnings</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* stats.alerts is no longer available */}
                            <div className={`p-4 rounded-lg bg-yellow-100 text-yellow-800`}>
                                <div className="flex items-start space-x-3">
                                    <AlertCircle className="h-5 w-5"/>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">
                                            Payment processing delayed. Please check payment gateway.
                                        </p>
                                        <p className="text-xs opacity-70 mt-1">
                                            2023-10-27 10:30 AM
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className={`p-4 rounded-lg bg-red-100 text-red-800`}>
                                <div className="flex items-start space-x-3">
                                    <AlertCircle className="h-5 w-5"/>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">
                                            Service 123 failed to complete. Please investigate.
                                        </p>
                                        <p className="text-xs opacity-70 mt-1">
                                            2023-10-26 02:15 PM
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
