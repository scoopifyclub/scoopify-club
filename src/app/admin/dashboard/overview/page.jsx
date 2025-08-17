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
        activeServices: 0,
        monthlyRevenue: 0,
        revenueChange: 0,
        customerChange: 0,
        serviceCompletion: {
            completed: 0,
            total: 0
        },
        recentActivity: [],
        paymentStats: {
            total: 0,
            amount: 0,
            pending: 0
        },
        alerts: []
    });
    const [isLoading, setIsLoading] = useState(true);

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
                if (!data.success) {
                    throw new Error(data.error || 'Failed to fetch dashboard data');
                }

                // The API now returns data in a stats object with nested structure
                const dashboardData = data.stats;
                setStats({
                    totalCustomers: dashboardData.overview?.totalCustomers || 0,
                    totalEmployees: dashboardData.overview?.totalEmployees || 0,
                    activeServices: dashboardData.services?.total || 0,
                    monthlyRevenue: dashboardData.overview?.monthlyRevenue || 0,
                    revenueChange: dashboardData.overview?.revenueChange || 0,
                    customerChange: dashboardData.overview?.customerGrowth || 0,
                    serviceCompletion: {
                        completed: dashboardData.services?.completed || 0,
                        total: dashboardData.services?.total || 0
                    },
                    recentActivity: dashboardData.recentActivity?.map(activity => ({
                        id: activity.id,
                        type: activity.type,
                        status: activity.status,
                        description: `${activity.customerName} - ${activity.employeeName}`,
                        time: new Date(activity.date).toLocaleDateString()
                    })) || [],
                    paymentStats: {
                        total: dashboardData.thisMonth?.payments || 0,
                        amount: dashboardData.thisMonth?.totalPaymentAmount || 0,
                        pending: dashboardData.services?.pending || 0
                    },
                    alerts: [] // No alerts in current API response
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
                    activeServices: 0,
                    monthlyRevenue: 0,
                    revenueChange: 0,
                    customerChange: 0,
                    serviceCompletion: {
                        completed: 0,
                        total: 0
                    },
                    recentActivity: [],
                    paymentStats: {
                        total: 0,
                        amount: 0,
                        pending: 0
                    },
                    alerts: []
                });
            } finally {
                setIsLoading(false);
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

    const completionRate = stats.serviceCompletion.total > 0
        ? Math.round((stats.serviceCompletion.completed / stats.serviceCompletion.total) * 100)
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
                            {stats.customerChange > 0 ? (
                                <>
                                    <ArrowUpIcon className="h-3 w-3 mr-1 text-green-500"/>
                                    <span className="text-green-500">{stats.customerChange}% </span>
                                </>
                            ) : (
                                <>
                                    <ArrowDownIcon className="h-3 w-3 mr-1 text-red-500"/>
                                    <span className="text-red-500">{Math.abs(stats.customerChange)}% </span>
                                </>
                            )}
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
                        <div className="text-2xl font-bold">${stats.monthlyRevenue.toLocaleString()}</div>
                        <div className="flex items-center pt-1 text-xs text-muted-foreground">
                            {stats.revenueChange > 0 ? (
                                <>
                                    <ArrowUpIcon className="h-3 w-3 mr-1 text-green-500"/>
                                    <span className="text-green-500">{stats.revenueChange}% </span>
                                </>
                            ) : (
                                <>
                                    <ArrowDownIcon className="h-3 w-3 mr-1 text-red-500"/>
                                    <span className="text-red-500">{Math.abs(stats.revenueChange)}% </span>
                                </>
                            )}
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
                            {stats.serviceCompletion.completed} completed this month
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
                            {stats.recentActivity.map((activity) => (
                                <div key={activity.id} className="flex items-start space-x-4">
                                    {getActivityIcon(activity.type)}
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            {activity.description}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {activity.time}
                                        </p>
                                    </div>
                                    <Badge variant={activity.status === 'error' ? 'destructive' : 'outline'}>
                                        {activity.status}
                                    </Badge>
                                </div>
                            ))}
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
                            {stats.alerts.map((alert) => (
                                <div key={alert.id} className={`p-4 rounded-lg ${getSeverityColor(alert.severity)}`}>
                                    <div className="flex items-start space-x-3">
                                        <AlertCircle className="h-5 w-5"/>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">
                                                {alert.message}
                                            </p>
                                            <p className="text-xs opacity-70 mt-1">
                                                {alert.time}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
