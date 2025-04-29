'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, TrendingUp, Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';

/**
 * @typedef {Object} EarningsData
 * @property {number} totalEarnings
 * @property {number} pendingPayments
 * @property {number} completedJobs
 * @property {number} averageRating
 * @property {Array<{date: string, amount: number}>} recentEarnings
 */

/**
 * Dashboard component for displaying employee earnings information
 * @returns {JSX.Element} The EarningsDashboard component
 */
export default function EarningsDashboard() {
    const [isLoading, setIsLoading] = useState(true);
    const [timeframe, setTimeframe] = useState('week');
    const [earnings, setEarnings] = useState(/** @type {EarningsData|null} */ (null));

    useEffect(() => {
        fetchEarningsData();
    }, [timeframe]);

    /**
     * Fetches earnings data from the API
     */
    const fetchEarningsData = async () => {
        try {
            const response = await fetch(`/api/employee/earnings?timeframe=${timeframe}`);
            if (!response.ok) throw new Error('Failed to fetch earnings data');
            const data = await response.json();
            setEarnings(data);
        } catch (error) {
            console.error('Error fetching earnings:', error);
            toast.error('Failed to load earnings data');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                        </CardHeader>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight">Earnings Overview</h2>
                <Select value={timeframe} onValueChange={setTimeframe}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select timeframe" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                        <SelectItem value="year">This Year</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${earnings?.totalEarnings.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">
                            +20.1% from last {timeframe}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${earnings?.pendingPayments.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">
                            From {earnings?.completedJobs || 0} completed jobs
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed Jobs</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{earnings?.completedJobs}</div>
                        <p className="text-xs text-muted-foreground">
                            This {timeframe}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{earnings?.averageRating.toFixed(1)}</div>
                        <p className="text-xs text-muted-foreground">
                            From customer reviews
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Earnings</CardTitle>
                    <CardDescription>Your earnings for the past {timeframe}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {earnings?.recentEarnings.map((earning, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="p-2 bg-primary/10 rounded-full">
                                        <DollarSign className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">{earning.date}</p>
                                        <p className="text-sm text-muted-foreground">Payment received</p>
                                    </div>
                                </div>
                                <div className="font-medium">${earning.amount.toFixed(2)}</div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 