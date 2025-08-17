'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarIcon, TrendingUpIcon, UsersIcon, DollarSignIcon, MapPinIcon, ClockIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminAnalyticsPage() {
    const { user, status } = useAuth({ required: true, role: 'ADMIN', redirectTo: '/login' });
    const [analytics, setAnalytics] = useState({
        overview: {},
        trends: {},
        geographic: {},
        performance: {},
        revenue: {}
    });
    const [isLoading, setIsLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('30d');

    useEffect(() => {
        if (status === 'authenticated') {
            fetchAnalytics();
        }
    }, [status, timeRange]);

    const fetchAnalytics = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/admin/analytics?range=${timeRange}`, {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch analytics data');
            }

            const data = await response.json();
            setAnalytics(data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
            toast.error('Failed to load analytics data');
        } finally {
            setIsLoading(false);
        }
    };

    if (status === 'loading' || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-lg">Loading analytics...</p>
                </div>
            </div>
        );
    }

    if (status === 'unauthenticated' || (user && user.role !== 'ADMIN')) {
        return null;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
                    <p className="text-muted-foreground">
                        Comprehensive business intelligence and performance metrics
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={timeRange === '7d' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTimeRange('7d')}
                    >
                        7 Days
                    </Button>
                    <Button
                        variant={timeRange === '30d' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTimeRange('30d')}
                    >
                        30 Days
                    </Button>
                    <Button
                        variant={timeRange === '90d' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTimeRange('90d')}
                    >
                        90 Days
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="trends">Trends</TabsTrigger>
                    <TabsTrigger value="geographic">Geographic</TabsTrigger>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                    <TabsTrigger value="revenue">Revenue</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    ${analytics.overview?.totalRevenue?.toLocaleString() || '0'}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {timeRange === '7d' ? 'This week' : timeRange === '30d' ? 'This month' : 'This quarter'}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
                                <UsersIcon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {analytics.overview?.activeCustomers || '0'}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {analytics.overview?.customerGrowth > 0 ? '+' : ''}{analytics.overview?.customerGrowth || '0'}% growth
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Service Completion</CardTitle>
                                <ClockIcon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {analytics.overview?.completionRate || '0'}%
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {analytics.overview?.completedServices || '0'} of {analytics.overview?.totalServices || '0'} services
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Coverage Areas</CardTitle>
                                <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {analytics.overview?.activeCoverageAreas || '0'}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {analytics.overview?.totalZipCodes || '0'} zip codes covered
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Top Performing Scoopers</CardTitle>
                                <CardDescription>Best service providers by completion rate</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {analytics.overview?.topScoopers?.map((scooper, index) => (
                                        <div key={scooper.id} className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <Badge variant="outline">{index + 1}</Badge>
                                                <div>
                                                    <p className="font-medium">{scooper.name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {scooper.completedServices} services
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge variant="secondary">
                                                {scooper.completionRate}%
                                            </Badge>
                                        </div>
                                    )) || (
                                        <p className="text-center text-muted-foreground py-8">
                                            No scooper data available
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Revenue Trends</CardTitle>
                                <CardDescription>Revenue performance over time</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {analytics.overview?.revenueTrends?.map((trend, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <TrendingUpIcon className="h-4 w-4 text-green-500" />
                                                <span className="text-sm">{trend.period}</span>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">${trend.amount.toLocaleString()}</p>
                                                <p className={`text-xs ${trend.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {trend.change >= 0 ? '+' : ''}{trend.change}%
                                                </p>
                                            </div>
                                        </div>
                                    )) || (
                                        <p className="text-center text-muted-foreground py-8">
                                            No revenue trend data available
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="trends" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Customer Growth Trends</CardTitle>
                            <CardDescription>New customer acquisition over time</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64 flex items-center justify-center text-muted-foreground">
                                Chart visualization would go here
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="geographic" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Geographic Performance</CardTitle>
                            <CardDescription>Service performance by location</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64 flex items-center justify-center text-muted-foreground">
                                Map visualization would go here
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="performance" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Service Performance Metrics</CardTitle>
                            <CardDescription>Detailed service completion and quality metrics</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64 flex items-center justify-center text-muted-foreground">
                                Performance charts would go here
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="revenue" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Revenue Analytics</CardTitle>
                            <CardDescription>Detailed revenue breakdown and analysis</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64 flex items-center justify-center text-muted-foreground">
                                Revenue charts would go here
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
