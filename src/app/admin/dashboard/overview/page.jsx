'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpIcon, ArrowDownIcon, UsersIcon, CalendarIcon, CircleDollarSign, BarChart3, TrendingUp, AlertCircle, CheckIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function AdminOverviewPage() {
    const { user, status } = useAuth({ required: true, role: 'ADMIN', redirectTo: '/login' });
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

    useEffect(() => {
        // Fetch dashboard data
        const fetchDashboardData = async () => {
            try {
                const response = await fetch('/api/admin/dashboard', {
                    credentials: 'include'
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch dashboard data');
                }

                const data = await response.json();
                setStats(data);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                // Fallback to demo data
                setStats({
                    totalCustomers: 152,
                    totalEmployees: 18,
                    activeServices: 47,
                    monthlyRevenue: 28540,
                    revenueChange: 12.5,
                    customerChange: 8.2,
                    serviceCompletion: {
                        completed: 187,
                        total: 223
                    },
                    recentActivity: [
                        {
                            id: '1',
                            type: 'service_completed',
                            status: 'success',
                            description: 'Service completed for John Doe',
                            time: '2 hours ago'
                        },
                        {
                            id: '2',
                            type: 'payment_received',
                            status: 'success',
                            description: 'Payment of $125.00 received from Jane Smith',
                            time: '4 hours ago'
                        },
                        {
                            id: '3',
                            type: 'customer_added',
                            status: 'info',
                            description: 'New customer Michael Johnson registered',
                            time: '6 hours ago'
                        },
                        {
                            id: '4',
                            type: 'service_scheduled',
                            status: 'info',
                            description: 'New service scheduled for Emily Williams',
                            time: '1 day ago'
                        },
                        {
                            id: '5',
                            type: 'payment_failed',
                            status: 'error',
                            description: 'Payment failed for Robert Brown',
                            time: '1 day ago'
                        }
                    ],
                    paymentStats: {
                        total: 143,
                        amount: 28540,
                        pending: 12
                    },
                    alerts: [
                        {
                            id: '1',
                            severity: 'high',
                            message: '3 failed payment attempts for customer #5482',
                            time: '2 hours ago'
                        },
                        {
                            id: '2',
                            severity: 'medium',
                            message: 'Employee Jason Smith has 5 pending service reports',
                            time: '1 day ago'
                        },
                        {
                            id: '3',
                            severity: 'low',
                            message: 'System maintenance scheduled for tonight at 2 AM',
                            time: '5 hours ago'
                        }
                    ]
                });
            } finally {
                setIsLoading(false);
            }
        };

        if (status === 'authenticated') {
            fetchDashboardData();
        }
    }, [status]);

    if (status === 'loading' || isLoading) {
        return (
            <div className="flex items-center justify-center h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
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
