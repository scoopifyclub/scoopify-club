'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Download, ArrowUpIcon, CircleDollarSign, BarChart3, Users, Activity, Clock, HelpCircle } from 'lucide-react';
import { format, subDays, subMonths } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

export default function ReportsPage() {
    const { user, loading } = useAuth({ required: true, role: 'ADMIN' });
    const router = useRouter();
    const { toast } = useToast();
    const [reportData, setReportData] = useState(null);
    const [dateRange, setDateRange] = useState('30days');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
            return;
        }
        if (user) {
            fetchReportData();
        }
    }, [loading, user, dateRange]);

    const fetchReportData = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/admin/reports?range=${dateRange}`, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to fetch report data');
            }

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to fetch report data');
            }

            // Transform the data to match the expected structure
            const transformedData = {
                revenueByDay: data.reports?.revenueByDay?.map(item => ({
                    name: item.date,
                    revenue: item.amount
                })) || [],
                servicesByType: data.reports?.servicesByType?.map(item => ({
                    name: item.type,
                    count: item.count
                })) || [],
                servicesByRegion: data.reports?.servicesByRegion?.map(item => ({
                    name: item.region,
                    count: item.count
                })) || [],
                topEmployees: data.reports?.topEmployees?.map(employee => ({
                    name: employee.User?.name || 'Unknown Employee',
                    completedServices: employee.completedServices || 0,
                    revenue: employee.revenue || 0,
                    rating: employee.rating || 0
                })) || []
            };

            setReportData(transformedData);
        } catch (error) {
            console.error('Error fetching report data:', error);
            toast.error('Failed to load report data', {
                description: error.message
            });
            setReportData(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const response = await fetch(`/api/admin/reports/export?range=${dateRange}`, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error('Failed to export report data');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `report-${dateRange}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast({
                title: "Success",
                description: "Report exported successfully.",
            });
        } catch (error) {
            console.error('Error exporting report:', error);
            toast({
                title: "Error",
                description: "Failed to export report. Please try again.",
                variant: "destructive"
            });
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const renderBarChart = (data, valueKey) => {
        if (!data || !data.length) return null;
        const maxValue = Math.max(...data.map(item => item[valueKey]));
        return (
            <div className="mt-2">
                {data.map((item, index) => (
                    <div key={index} className="mb-2">
                        <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">{item.name}</span>
                            <span className="text-sm text-muted-foreground">
                                {valueKey === 'revenue' ? formatCurrency(item[valueKey]) : item[valueKey]}
                            </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                            <div 
                                className="bg-primary rounded-full h-2" 
                                style={{ width: `${(item[valueKey] / maxValue) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    if (loading || isLoading) {
        return (
            <div className="flex items-center justify-center h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!reportData) {
        return (
            <div className="flex flex-col items-center justify-center h-[400px]">
                <HelpCircle className="h-12 w-12 text-muted-foreground mb-4"/>
                <h3 className="text-lg font-medium">No Data Available</h3>
                <p className="text-muted-foreground mb-4">
                    We couldn't load the report data at this time.
                </p>
                <Button onClick={fetchReportData}>Try Again</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
                    <p className="text-muted-foreground">
                        Business performance metrics and insights
                    </p>
                </div>
                <div className="flex gap-2">
                    <div className="relative w-[180px]">
                        <select 
                            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" 
                            value={dateRange} 
                            onChange={(e) => setDateRange(e.target.value)}
                        >
                            <option value="7days">Last 7 Days</option>
                            <option value="30days">Last 30 Days</option>
                            <option value="90days">Last 90 Days</option>
                            <option value="12months">Last 12 Months</option>
                        </select>
                        <CalendarIcon className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none"/>
                    </div>
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="h-4 w-4 mr-2"/>
                        Export
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Revenue Overview</CardTitle>
                    <CardDescription>Total earnings and service count trends</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-muted/50 p-4 rounded-lg">
                            <div className="text-sm text-muted-foreground mb-1">Total Revenue</div>
                            <div className="text-2xl font-bold">
                                {formatCurrency(reportData.totalRevenue)}
                            </div>
                            <div className="flex items-center mt-1 text-xs">
                                <ArrowUpIcon className="h-3 w-3 mr-1 text-green-500"/>
                                <span className="text-green-500">{reportData.revenueGrowth}%</span>
                                <span className="text-muted-foreground ml-1">vs previous period</span>
                            </div>
                        </div>
                        <div className="bg-muted/50 p-4 rounded-lg">
                            <div className="text-sm text-muted-foreground mb-1">Total Services</div>
                            <div className="text-2xl font-bold">
                                {reportData.totalServices}
                            </div>
                            <div className="flex items-center mt-1 text-xs">
                                <ArrowUpIcon className="h-3 w-3 mr-1 text-green-500"/>
                                <span className="text-green-500">{reportData.servicesGrowth}%</span>
                                <span className="text-muted-foreground ml-1">vs previous period</span>
                            </div>
                        </div>
                        <div className="bg-muted/50 p-4 rounded-lg">
                            <div className="text-sm text-muted-foreground mb-1">Average Revenue</div>
                            <div className="text-2xl font-bold">
                                {formatCurrency(reportData.averageRevenue)}
                            </div>
                            <div className="flex items-center mt-1 text-xs">
                                <ArrowUpIcon className="h-3 w-3 mr-1 text-green-500"/>
                                <span className="text-green-500">{reportData.averageRevenueGrowth}%</span>
                                <span className="text-muted-foreground ml-1">vs previous period</span>
                            </div>
                        </div>
                    </div>

                    <div className="w-full h-64 bg-muted/20 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                            <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto mb-2"/>
                            <p className="text-muted-foreground">Revenue chart visualization would appear here</p>
                            <p className="text-xs text-muted-foreground">Daily revenue for the selected period</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Services by Type</CardTitle>
                    <CardDescription>Distribution of services and revenue</CardDescription>
                </CardHeader>
                <CardContent>
                    {renderBarChart(reportData.servicesByType, 'revenue')}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Services by Region</CardTitle>
                    <CardDescription>Geographic distribution of services</CardDescription>
                </CardHeader>
                <CardContent>
                    {renderBarChart(reportData.servicesByRegion, 'count')}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Top Performing Employees</CardTitle>
                    <CardDescription>Based on service completion and customer satisfaction</CardDescription>
                </CardHeader>
                <CardContent>
                    {reportData.topEmployees && (
                        <div className="space-y-4">
                            {reportData.topEmployees.map((employee, index) => (
                                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <div className="font-medium">{employee.name}</div>
                                        <div className="text-sm text-muted-foreground">
                                            {employee.completedServices} services completed
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-medium">{formatCurrency(employee.revenue)}</div>
                                        <div className="text-sm text-muted-foreground">
                                            {employee.rating.toFixed(1)} rating
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
