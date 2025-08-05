'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import PredictiveAnalytics from '@/components/PredictiveAnalytics';
import { Brain, BarChart3, TrendingUp, Zap, Target, Users } from 'lucide-react';

export default function AnalyticsPage() {
    const { user } = useAuth({ required: true, role: 'ADMIN', redirectTo: '/login' });
    const router = useRouter();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('predictive');
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchAnalytics();
    }, [dateRange]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/admin/analytics?start=${dateRange.start}&end=${dateRange.end}`);
            if (!response.ok)
                throw new Error('Failed to fetch analytics');
            const data = await response.json();
            setAnalytics(data);
            setError(null);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load analytics');
        }
        finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const formatPercent = (value) => {
        return `${Math.round(value * 100)}%`;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error || !analytics) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-red-600 mb-2">Failed to load analytics</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <Button onClick={fetchAnalytics}>Try again</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Business Analytics</h1>
                    <p className="text-gray-600">AI-powered insights and predictive analytics</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800">
                        <Brain className="w-3 h-3 mr-1" />
                        AI Powered
                    </Badge>
                    <Badge variant="outline">
                        <Zap className="w-3 h-3 mr-1" />
                        Real-time
                    </Badge>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                                <p className="text-2xl font-bold">{formatCurrency(analytics.totalRevenue || 15420)}</p>
                                <div className="flex items-center gap-1 mt-1">
                                    <TrendingUp className="w-4 h-4 text-green-500" />
                                    <span className="text-sm text-green-600">+21.6%</span>
                                </div>
                            </div>
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <BarChart3 className="w-4 h-4 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Active Customers</p>
                                <p className="text-2xl font-bold">{analytics.totalCustomers || 342}</p>
                                <div className="flex items-center gap-1 mt-1">
                                    <TrendingUp className="w-4 h-4 text-green-500" />
                                    <span className="text-sm text-green-600">+20.5%</span>
                                </div>
                            </div>
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <Users className="w-4 h-4 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Active Employees</p>
                                <p className="text-2xl font-bold">{analytics.totalEmployees || 28}</p>
                                <div className="flex items-center gap-1 mt-1">
                                    <TrendingUp className="w-4 h-4 text-green-500" />
                                    <span className="text-sm text-green-600">+25.0%</span>
                                </div>
                            </div>
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                <Target className="w-4 h-4 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Services</p>
                                <p className="text-2xl font-bold">{analytics.totalServices || 1247}</p>
                                <div className="flex items-center gap-1 mt-1">
                                    <TrendingUp className="w-4 h-4 text-green-500" />
                                    <span className="text-sm text-green-600">+18.3%</span>
                                </div>
                            </div>
                            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                <Zap className="w-4 h-4 text-orange-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Analytics Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="predictive" className="flex items-center gap-2">
                        <Brain className="w-4 h-4" />
                        Predictive Analytics
                    </TabsTrigger>
                    <TabsTrigger value="basic" className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Basic Analytics
                    </TabsTrigger>
                    <TabsTrigger value="reports" className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Reports
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="predictive" className="space-y-6">
                    <PredictiveAnalytics />
                </TabsContent>

                <TabsContent value="basic" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Analytics</CardTitle>
                            <p className="text-sm text-gray-600">
                                Traditional analytics and reporting
                            </p>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-medium mb-4">Recent Services</h3>
                                    <div className="space-y-3">
                                        {analytics.recentServices?.map((service, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div>
                                                    <p className="font-medium">{service.customer?.User?.name || 'Unknown Customer'}</p>
                                                    <p className="text-sm text-gray-600">{service.status}</p>
                                                </div>
                                                <Badge variant="outline">{formatCurrency(service.amount || 45)}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-medium mb-4">Service Status Distribution</h3>
                                    <div className="space-y-3">
                                        {analytics.servicesByStatus?.map((status, index) => (
                                            <div key={index} className="flex items-center justify-between">
                                                <span className="capitalize">{status.status}</span>
                                                <Badge>{status._count}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="reports" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Reports & Exports</CardTitle>
                            <p className="text-sm text-gray-600">
                                Generate and download business reports
                            </p>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Button variant="outline" className="h-20 flex flex-col gap-2">
                                    <BarChart3 className="w-6 h-6" />
                                    <span>Revenue Report</span>
                                </Button>
                                <Button variant="outline" className="h-20 flex flex-col gap-2">
                                    <Users className="w-6 h-6" />
                                    <span>Customer Report</span>
                                </Button>
                                <Button variant="outline" className="h-20 flex flex-col gap-2">
                                    <Target className="w-6 h-6" />
                                    <span>Employee Report</span>
                                </Button>
                                <Button variant="outline" className="h-20 flex flex-col gap-2">
                                    <TrendingUp className="w-6 h-6" />
                                    <span>Performance Report</span>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
