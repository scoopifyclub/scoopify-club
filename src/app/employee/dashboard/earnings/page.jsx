'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { ChevronDown, Download, DollarSign, BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';

export const dynamic = 'force-dynamic';

export default function EarningsPage() {
    const { user, loading: authLoading } = useAuth({ 
        requiredRole: 'EMPLOYEE',
        redirectTo: '/auth/login?callbackUrl=/employee/dashboard/earnings'
    });

    const [isClient, setIsClient] = useState(false);
    const [earningsData, setEarningsData] = useState(null);
    const [timeframe, setTimeframe] = useState('monthly');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Set isClient to true on mount
    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            
            try {
                setError(null);
                setLoading(true);
                
                const response = await fetch(`/api/employee/earnings?timeframe=${timeframe}`);
                
                if (!response.ok) {
                    throw new Error('Failed to fetch earnings data');
                }

                const data = await response.json();
                setEarningsData(data);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to load earnings data';
                setError(errorMessage);
                toast.error(errorMessage);
                console.error('Error fetching earnings data:', err);
                
                // Fallback to mock data in development
                if (process.env.NODE_ENV === 'development') {
                    setEarningsData({
                        currentPeriodEarnings: 1250.75,
                        previousPeriodEarnings: 1100.50,
                        percentageChange: 13.7,
                        totalEarnings: 6752.25,
                        projectedEarnings: 1500.00,
                        transactions: [
                            {
                                id: '1',
                                date: format(subDays(new Date(), 2), 'yyyy-MM-dd'),
                                amount: 45.00,
                                status: 'completed',
                                description: 'Payment for job #1234',
                                type: 'payment'
                            },
                            {
                                id: '2',
                                date: format(subDays(new Date(), 3), 'yyyy-MM-dd'),
                                amount: 35.50,
                                status: 'completed',
                                description: 'Payment for job #1235',
                                type: 'payment'
                            },
                            {
                                id: '3',
                                date: format(subDays(new Date(), 5), 'yyyy-MM-dd'),
                                amount: 10.00,
                                status: 'completed',
                                description: 'Customer tip',
                                type: 'bonus'
                            },
                            {
                                id: '4',
                                date: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
                                amount: 42.25,
                                status: 'completed',
                                description: 'Payment for job #1236',
                                type: 'payment'
                            },
                            {
                                id: '5',
                                date: format(subDays(new Date(), 9), 'yyyy-MM-dd'),
                                amount: 50.00,
                                status: 'completed',
                                description: 'Payment for job #1237',
                                type: 'payment'
                            }
                        ],
                        weeklyEarnings: [
                            { week: 'Week 1', amount: 325.50 },
                            { week: 'Week 2', amount: 275.00 },
                            { week: 'Week 3', amount: 350.25 },
                            { week: 'Week 4', amount: 300.00 }
                        ]
                    });
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, timeframe]);

    const handleDownloadStatement = async () => {
        try {
            toast.promise(
                fetch('/api/employee/earnings/statement', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ timeframe })
                }).then(res => {
                    if (!res.ok) throw new Error('Failed to generate statement');
                    return res.blob();
                }).then(blob => {
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `earnings-statement-${timeframe}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                }),
                {
                    loading: 'Generating statement...',
                    success: 'Statement downloaded successfully',
                    error: 'Failed to download statement'
                }
            );
        } catch (error) {
            console.error('Error downloading statement:', error);
        }
    };

    // If not client-side yet, show loading state
    if (!isClient) {
        return (
            <div className="flex items-center justify-center h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            </div>
        );
    }

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center h-[400px] transition-opacity duration-300">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            </div>
        );
    }

    if (!earningsData && !error) {
        return (
            <div className="p-6">
                <div className="bg-amber-50 text-amber-800 p-4 rounded-md">
                    No earnings data available. Please try again later.
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
                    <p className="font-medium">Error loading earnings data</p>
                    <p>{error}</p>
                    <Button 
                        variant="outline" 
                        className="mt-2" 
                        onClick={() => {
                            setError(null);
                            setLoading(true);
                            fetchData();
                        }}
                    >
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'text-green-600';
            case 'pending':
                return 'text-amber-600';
            case 'failed':
                return 'text-red-600';
            default:
                return 'text-gray-600';
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'payment':
                return <DollarSign className="h-4 w-4 text-green-500"/>;
            case 'bonus':
                return <ArrowUpRight className="h-4 w-4 text-blue-500"/>;
            case 'refund':
                return <ArrowDownRight className="h-4 w-4 text-red-500"/>;
            default:
                return <DollarSign className="h-4 w-4 text-gray-500"/>;
        }
    };

    return (
        <div className="p-6 space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Earnings</h1>
                    <p className="text-gray-500">
                        Track your income and payment history
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <div className="flex items-center bg-white px-3 py-2 rounded-lg border cursor-pointer">
                                <span className="font-medium">
                                    {timeframe === 'weekly' ? 'This Week' :
                                    timeframe === 'monthly' ? `${format(startOfMonth(new Date()), 'MMM')} - ${format(endOfMonth(new Date()), 'MMM yyyy')}` :
                                    'This Year'}
                                </span>
                                <ChevronDown className="ml-2 h-4 w-4 text-gray-500"/>
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setTimeframe('weekly')}>
                                Weekly
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTimeframe('monthly')}>
                                Monthly
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTimeframe('yearly')}>
                                Yearly
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={handleDownloadStatement}
                    >
                        <Download className="h-4 w-4"/>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Current {timeframe} earnings</CardDescription>
                        <CardTitle className="text-3xl font-bold">
                            ${earningsData.currentPeriodEarnings.toFixed(2)}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm">
                            <span className={earningsData.percentageChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {earningsData.percentageChange >= 0 ? '↑' : '↓'} {Math.abs(earningsData.percentageChange)}%
                            </span>
                            <span className="text-gray-500">vs last {timeframe}</span>
                        </div>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total earnings</CardDescription>
                        <CardTitle className="text-3xl font-bold">
                            ${earningsData.totalEarnings.toFixed(2)}
                        </CardTitle>
                        <div className="text-sm text-gray-500">
                            Lifetime earnings
                        </div>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Projected earnings</CardDescription>
                        <CardTitle className="text-3xl font-bold">
                            ${earningsData.projectedEarnings.toFixed(2)}
                        </CardTitle>
                        <div className="text-sm text-gray-500">
                            Based on scheduled jobs
                        </div>
                    </CardHeader>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>
                        Your latest payments and earnings
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {earningsData.transactions.map((transaction) => (
                            <div key={transaction.id} className="flex items-center justify-between py-2">
                                <div className="flex items-center gap-3">
                                    {getTypeIcon(transaction.type)}
                                    <div>
                                        <p className="font-medium">{transaction.description}</p>
                                        <p className="text-sm text-gray-500">
                                            {format(new Date(transaction.date), 'MMM d, yyyy')}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium">
                                        ${transaction.amount.toFixed(2)}
                                    </p>
                                    <p className={`text-sm ${getStatusColor(transaction.status)}`}>
                                        {transaction.status}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Weekly Breakdown</CardTitle>
                    <CardDescription>
                        Your earnings for each week this month
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {earningsData.weeklyEarnings.map((week) => (
                            <div key={week.week} className="flex items-center justify-between">
                                <p className="font-medium">{week.week}</p>
                                <div className="flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4 text-gray-400" />
                                    <p className="font-medium">${week.amount.toFixed(2)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
