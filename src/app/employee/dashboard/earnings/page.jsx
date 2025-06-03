"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    DollarSign, 
    TrendingUp, 
    Calendar, 
    Clock, 
    Download,
    CreditCard,
    Banknote,
    PiggyBank,
    BarChart3
} from 'lucide-react';

export default function EarningsPage() {
    const [earnings, setEarnings] = useState({});
    const [payouts, setPayouts] = useState([]);
    const [recentServices, setRecentServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Fetch real earnings data from existing dashboard API
        const fetchEarningsData = async () => {
            try {
                const response = await fetch('/api/employee/dashboard', {
                    credentials: 'include',
                });
                
                if (response.ok) {
                    const data = await response.json();
                    
                    // Use stats from dashboard API
                    const stats = data.stats || {};
                    setEarnings({
                        today: 0, // Dashboard API doesn't have daily breakdown
                        thisWeek: 0, // Dashboard API doesn't have weekly breakdown
                        thisMonth: 0, // Dashboard API doesn't have monthly breakdown
                        totalEarnings: stats.earnings || 0,
                        pending: 0, // Dashboard API doesn't track pending separately
                        avgPerService: stats.totalServices > 0 ? (stats.earnings / stats.totalServices) : 0,
                        totalServices: stats.completedServices || 0,
                        topCustomerValue: 0 // Not available in dashboard API
                    });
                    
                    // For now, use empty arrays for payouts and recent services
                    // These could be populated from services API if needed
                    setPayouts([]);
                    setRecentServices([]);
                } else {
                    console.error('Failed to fetch dashboard data');
                    setError('Failed to load earnings data');
                    setEarnings({
                        today: 0,
                        thisWeek: 0,
                        thisMonth: 0,
                        totalEarnings: 0,
                        pending: 0,
                        avgPerService: 0,
                        totalServices: 0,
                        topCustomerValue: 0
                    });
                    setPayouts([]);
                    setRecentServices([]);
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                setError('Failed to load earnings data');
                // Set empty defaults on error
                setEarnings({
                    today: 0,
                    thisWeek: 0,
                    thisMonth: 0,
                    totalEarnings: 0,
                    pending: 0,
                    avgPerService: 0,
                    totalServices: 0,
                    topCustomerValue: 0
                });
                setPayouts([]);
                setRecentServices([]);
            } finally {
                setLoading(false);
            }
        };
        
        fetchEarningsData();
    }, []);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed':
                return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
            case 'pending':
                return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
            case 'paid':
                return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-32 bg-gray-200 rounded"></div>
                    <div className="h-32 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold mb-2">Earnings</h1>
                    <p className="text-gray-600">Track your income and payment history</p>
                </div>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-red-600 mb-4">⚠️ {error}</p>
                            <Button onClick={() => window.location.reload()}>
                                Try Again
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">Earnings</h1>
                <p className="text-gray-600">Track your income and payment history</p>
            </div>

            {/* Earnings Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <DollarSign className="h-8 w-8 text-green-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Today's Earnings</p>
                                <p className="text-2xl font-bold">${earnings.today?.toFixed(2)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <TrendingUp className="h-8 w-8 text-blue-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">This Week</p>
                                <p className="text-2xl font-bold">${earnings.thisWeek?.toFixed(2)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <Calendar className="h-8 w-8 text-purple-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">This Month</p>
                                <p className="text-2xl font-bold">${earnings.thisMonth?.toFixed(2)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <PiggyBank className="h-8 w-8 text-orange-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                                <p className="text-2xl font-bold">${earnings.totalEarnings?.toFixed(2)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <Clock className="h-8 w-8 text-yellow-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                                <p className="text-2xl font-bold">${earnings.pending?.toFixed(2)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <BarChart3 className="h-8 w-8 text-indigo-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Avg per Service</p>
                                <p className="text-2xl font-bold">${earnings.avgPerService?.toFixed(2)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <Banknote className="h-8 w-8 text-teal-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Services</p>
                                <p className="text-2xl font-bold">{earnings.totalServices}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Earnings Details */}
            <Tabs defaultValue="recent" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="recent">Recent Services</TabsTrigger>
                    <TabsTrigger value="payouts">Payment History</TabsTrigger>
                </TabsList>

                <TabsContent value="recent" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Recent Services</CardTitle>
                                <Button variant="outline" size="sm">
                                    <Download className="h-4 w-4 mr-2" />
                                    Export
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentServices.length > 0 ? (
                                    recentServices.map((service) => (
                                        <div key={service.id} className="border rounded-lg p-4 hover:bg-gray-50">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h3 className="font-medium">{service.customer}</h3>
                                                        {getStatusBadge(service.status)}
                                                    </div>
                                                    <p className="text-sm text-gray-600 mb-1">{service.service}</p>
                                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                                        <span>{new Date(service.date).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-bold text-green-600">
                                                        ${service.amount.toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8">
                                        <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500">No recent services found</p>
                                        <p className="text-sm text-gray-400">Your earnings will appear here after completing services</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="payouts" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Payment History</CardTitle>
                                <Button variant="outline" size="sm">
                                    <Download className="h-4 w-4 mr-2" />
                                    Download Statements
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {payouts.length > 0 ? (
                                    payouts.map((payout) => (
                                        <div key={payout.id} className="border rounded-lg p-4 hover:bg-gray-50">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <CreditCard className="h-4 w-4 text-gray-500" />
                                                        <span className="font-medium">{payout.method}</span>
                                                        {getStatusBadge(payout.status)}
                                                    </div>
                                                    <p className="text-sm text-gray-600 mb-1">
                                                        Period: {new Date(payout.periodStart).toLocaleDateString()} - {new Date(payout.periodEnd).toLocaleDateString()}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {payout.status === 'completed' ? 'Paid on' : 'Expected'}: {new Date(payout.date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-bold text-green-600">
                                                        ${payout.amount.toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8">
                                        <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500">No payment history found</p>
                                        <p className="text-sm text-gray-400">Your payment history will appear here</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Earnings Insights */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Earnings Insights</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h4 className="font-medium text-gray-700">Performance Metrics</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Average service value</span>
                                    <span className="font-medium">${earnings.avgPerService?.toFixed(2) || '0.00'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Total services completed</span>
                                    <span className="font-medium">{earnings.totalServices || 0}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Total earnings</span>
                                    <span className="font-medium text-green-600">${earnings.totalEarnings?.toFixed(2) || '0.00'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Top service value</span>
                                    <span className="font-medium">${earnings.topCustomerValue?.toFixed(2) || '0.00'}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <h4 className="font-medium text-gray-700">Payment Status</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">This month's earnings</span>
                                    <span className="font-medium">${earnings.thisMonth?.toFixed(2) || '0.00'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">This week's earnings</span>
                                    <span className="font-medium">${earnings.thisWeek?.toFixed(2) || '0.00'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Today's earnings</span>
                                    <span className="font-medium">${earnings.today?.toFixed(2) || '0.00'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Pending amount</span>
                                    <span className="font-medium text-yellow-600">${earnings.pending?.toFixed(2) || '0.00'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
