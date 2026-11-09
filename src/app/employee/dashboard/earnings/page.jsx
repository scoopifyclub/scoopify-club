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
    const [account, setAccount] = useState(null);
    const [schedule, setSchedule] = useState(null);
    const [connecting, setConnecting] = useState(false);

    const startOnboarding = async () => {
        setConnecting(true);
        try {
            const response = await fetch('/api/employee/stripe-connect', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'onboarding-link' }),
            });
            const data = await response.json();
            if (response.ok && data.url) {
                window.location.href = data.url;
                return;
            }
            setError(data.error || 'Could not start Stripe setup');
        } catch (err) {
            setError('Could not start Stripe setup');
        }
        setConnecting(false);
    };

    useEffect(() => {
        const fetchEarningsData = async () => {
            try {
                const response = await fetch('/api/employee/payouts', {
                    credentials: 'include',
                });
                
                if (response.ok) {
                    const data = await response.json();
                    const jobs = (data.earnings || []).filter((e) => e.kind === 'JOB' && e.status !== 'VOID');
                    const now = new Date();
                    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    const startOfWeek = new Date(startOfToday);
                    startOfWeek.setDate(startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7));
                    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                    const sumSince = (since) => jobs
                        .filter((e) => e.serviceDate && new Date(e.serviceDate) >= since)
                        .reduce((sum, e) => sum + e.amount, 0);
                    const totals = data.totals || {};
                    const earned = (totals.pending || 0) + (totals.held || 0) + (totals.processing || 0) + (totals.paid || 0);

                    setAccount(data.account);
                    setSchedule({ nextPayoutDate: data.nextPayoutDate, automaticPayouts: data.automaticPayouts, held: totals.held || 0 });
                    setEarnings({
                        today: sumSince(startOfToday),
                        thisWeek: sumSince(startOfWeek),
                        thisMonth: sumSince(startOfMonth),
                        totalEarnings: earned,
                        pending: (totals.pending || 0) + (totals.held || 0) + (totals.processing || 0),
                        avgPerService: jobs.length > 0 ? jobs.reduce((s, e) => s + e.amount, 0) / jobs.length : 0,
                        totalServices: jobs.length,
                        topCustomerValue: jobs.reduce((max, e) => Math.max(max, e.amount), 0)
                    });
                    setPayouts((data.payouts || []).map((p) => ({
                        id: p.id,
                        method: 'Stripe transfer',
                        status: p.status === 'PAID' ? 'paid' : p.status === 'FAILED' ? 'failed' : 'pending',
                        periodStart: p.periodStart,
                        periodEnd: p.periodEnd,
                        date: p.paidAt || data.nextPayoutDate,
                        amount: p.amount,
                        jobCount: p.jobCount,
                    })));
                    setRecentServices((data.earnings || []).map((e) => ({
                        id: e.id,
                        customer: e.kind === 'ADJUSTMENT' ? 'Adjustment (refunded job)' : 'Completed job',
                        service: e.status === 'HELD'
                            ? `On hold: customer ${e.holdReason === 'DISPUTE' ? 'dispute' : 'refund'} under review`
                            : e.status === 'VOID' ? 'Not payable: the customer was refunded' : '',
                        status: { PENDING: 'pending', HELD: 'held', PROCESSING: 'processing', PAID: 'paid', VOID: 'void' }[e.status] || e.status,
                        date: e.serviceDate,
                        amount: e.amount,
                    })));
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
            case 'processing':
                return <Badge className="bg-blue-100 text-blue-800">Sending</Badge>;
            case 'held':
                return <Badge className="bg-orange-100 text-orange-800">On hold</Badge>;
            case 'void':
                return <Badge className="bg-gray-100 text-gray-600">Not payable</Badge>;
            case 'failed':
                return <Badge className="bg-red-100 text-red-800">Retrying</Badge>;
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

            {account && (
                <Card className="mb-6">
                    <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <p className="font-medium">
                                {account.readyForTransfers
                                    ? 'Payouts are set up'
                                    : account.connected ? 'Finish your Stripe payout setup' : 'Set up payouts to get paid'}
                            </p>
                            <p className="text-sm text-gray-600">
                                {account.readyForTransfers
                                    ? `Verified jobs from last week are sent to your bank through Stripe every Friday${schedule?.nextPayoutDate ? ` (next: ${new Date(`${schedule.nextPayoutDate}T12:00:00`).toLocaleDateString()})` : ''}.`
                                    : 'Scoopify pays you by Stripe transfer. Stripe needs your identity and bank details once.'}
                                {schedule && !schedule.automaticPayouts ? ' Automatic payouts are not switched on yet.' : ''}
                                {schedule?.held > 0 ? ` $${schedule.held.toFixed(2)} is on hold while a customer refund or dispute is reviewed.` : ''}
                            </p>
                        </div>
                        {!account.readyForTransfers && (
                            <Button onClick={startOnboarding} disabled={connecting}>
                                {connecting ? 'Opening Stripe…' : account.connected ? 'Continue setup' : 'Set up payouts'}
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}

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
                                                        {payout.status === 'paid' ? 'Paid on' : 'Expected'}: {new Date(payout.date).toLocaleDateString()}
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
