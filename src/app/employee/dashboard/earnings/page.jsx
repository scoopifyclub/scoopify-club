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

    useEffect(() => {
        // Simulate loading earnings data
        setTimeout(() => {
            setEarnings({
                today: 75.00,
                thisWeek: 320.00,
                thisMonth: 1285.00,
                totalEarnings: 5420.00,
                pending: 125.00,
                avgPerService: 42.50,
                totalServices: 128,
                topCustomerValue: 180.00
            });

            setPayouts([
                {
                    id: 1,
                    amount: 890.00,
                    date: '2024-01-15',
                    status: 'completed',
                    method: 'Direct Deposit',
                    periodStart: '2024-01-01',
                    periodEnd: '2024-01-14'
                },
                {
                    id: 2,
                    amount: 1240.00,
                    date: '2024-01-01',
                    status: 'completed',
                    method: 'Direct Deposit',
                    periodStart: '2023-12-15',
                    periodEnd: '2023-12-31'
                },
                {
                    id: 3,
                    amount: 765.00,
                    date: '2023-12-15',
                    status: 'completed',
                    method: 'Direct Deposit',
                    periodStart: '2023-12-01',
                    periodEnd: '2023-12-14'
                },
                {
                    id: 4,
                    amount: 125.00,
                    date: '2024-01-29',
                    status: 'pending',
                    method: 'Direct Deposit',
                    periodStart: '2024-01-15',
                    periodEnd: '2024-01-28'
                }
            ]);

            setRecentServices([
                {
                    id: 1,
                    customer: 'John Smith',
                    service: 'Weekly Cleanup',
                    date: '2024-01-20',
                    amount: 45.00,
                    duration: '45 min',
                    status: 'paid'
                },
                {
                    id: 2,
                    customer: 'Sarah Johnson',
                    service: 'One-time Cleanup',
                    date: '2024-01-19',
                    amount: 60.00,
                    duration: '60 min',
                    status: 'paid'
                },
                {
                    id: 3,
                    customer: 'Mike Wilson',
                    service: 'Bi-weekly Cleanup',
                    date: '2024-01-19',
                    amount: 35.00,
                    duration: '30 min',
                    status: 'paid'
                },
                {
                    id: 4,
                    customer: 'Lisa Brown',
                    service: 'Weekly Cleanup',
                    date: '2024-01-18',
                    amount: 45.00,
                    duration: '40 min',
                    status: 'pending'
                },
                {
                    id: 5,
                    customer: 'David Lee',
                    service: 'Monthly Cleanup',
                    date: '2024-01-17',
                    amount: 80.00,
                    duration: '75 min',
                    status: 'paid'
                }
            ]);
            setLoading(false);
        }, 1000);
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
                                {recentServices.map((service) => (
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
                                                    <span>• Duration: {service.duration}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-green-600">
                                                    ${service.amount.toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
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
                                {payouts.map((payout) => (
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
                                ))}
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
                                    <span className="font-medium">${earnings.avgPerService?.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Services this month</span>
                                    <span className="font-medium">30</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Growth vs last month</span>
                                    <span className="font-medium text-green-600">+12%</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Top customer value</span>
                                    <span className="font-medium">${earnings.topCustomerValue?.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <h4 className="font-medium text-gray-700">Payment Information</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Payment method</span>
                                    <span className="font-medium">Direct Deposit</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Payment frequency</span>
                                    <span className="font-medium">Bi-weekly</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Next payout</span>
                                    <span className="font-medium">Jan 29, 2024</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Pending amount</span>
                                    <span className="font-medium text-yellow-600">${earnings.pending?.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
