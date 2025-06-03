"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    BarChart3, 
    TrendingUp, 
    Calendar, 
    Download,
    FileText,
    Target,
    Clock,
    Star,
    Users,
    DollarSign
} from 'lucide-react';

export default function ReportsPage() {
    const [reports, setReports] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate loading reports data
        setTimeout(() => {
            setReports({
                performanceMetrics: {
                    totalServices: 128,
                    completedServices: 125,
                    cancelledServices: 3,
                    averageRating: 4.8,
                    totalRevenue: 5420.00,
                    avgServiceTime: 48,
                    customerRetention: 92,
                    onTimeDelivery: 96
                },
                monthlyData: [
                    { month: 'Oct 2023', services: 28, revenue: 1200, rating: 4.7 },
                    { month: 'Nov 2023', services: 32, revenue: 1380, rating: 4.8 },
                    { month: 'Dec 2023', services: 35, revenue: 1520, rating: 4.9 },
                    { month: 'Jan 2024', services: 33, revenue: 1420, rating: 4.8 }
                ],
                topCustomers: [
                    { name: 'John Smith', services: 15, revenue: 675, rating: 5.0 },
                    { name: 'Lisa Brown', services: 12, revenue: 540, rating: 5.0 },
                    { name: 'Sarah Johnson', services: 10, revenue: 480, rating: 4.8 },
                    { name: 'Mike Wilson', services: 8, revenue: 320, rating: 4.9 },
                    { name: 'David Lee', services: 6, revenue: 480, rating: 4.7 }
                ],
                serviceTypes: [
                    { type: 'Weekly Cleanup', count: 65, percentage: 51 },
                    { type: 'Bi-weekly Cleanup', count: 35, percentage: 27 },
                    { type: 'Monthly Cleanup', count: 18, percentage: 14 },
                    { type: 'One-time Cleanup', count: 10, percentage: 8 }
                ],
                weeklyHours: [
                    { week: 'Week 1', hours: 28, services: 8 },
                    { week: 'Week 2', hours: 32, services: 9 },
                    { week: 'Week 3', hours: 35, services: 10 },
                    { week: 'Week 4', hours: 30, services: 8 }
                ]
            });
            setLoading(false);
        }, 1000);
    }, []);

    const generateReport = (reportType) => {
        // Simulate report generation
        console.log(`Generating ${reportType} report...`);
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
                <h1 className="text-2xl font-bold mb-2">Reports & Analytics</h1>
                <p className="text-gray-600">Track your performance and business insights</p>
            </div>

            {/* Key Performance Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <Target className="h-8 w-8 text-blue-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                                <p className="text-2xl font-bold">
                                    {((reports.performanceMetrics.completedServices / reports.performanceMetrics.totalServices) * 100).toFixed(1)}%
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <Star className="h-8 w-8 text-yellow-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                                <p className="text-2xl font-bold">{reports.performanceMetrics.averageRating}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <Clock className="h-8 w-8 text-green-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Avg Service Time</p>
                                <p className="text-2xl font-bold">{reports.performanceMetrics.avgServiceTime}min</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <Users className="h-8 w-8 text-purple-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Customer Retention</p>
                                <p className="text-2xl font-bold">{reports.performanceMetrics.customerRetention}%</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Reports Tabs */}
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                    <TabsTrigger value="customers">Customers</TabsTrigger>
                    <TabsTrigger value="exports">Export Reports</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    {/* Monthly Trends */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Monthly Performance Trends
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {reports.monthlyData.map((month, index) => (
                                    <div key={index} className="border rounded-lg p-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="font-medium">{month.month}</h3>
                                            <div className="flex items-center gap-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star 
                                                        key={i} 
                                                        className={`h-4 w-4 ${i < Math.floor(month.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                                                    />
                                                ))}
                                                <span className="text-sm text-gray-500 ml-1">({month.rating})</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-500">Services:</span>
                                                <span className="font-medium ml-2">{month.services}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Revenue:</span>
                                                <span className="font-medium ml-2">${month.revenue}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Service Types Breakdown */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Service Types Distribution
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {reports.serviceTypes.map((service, index) => (
                                    <div key={index} className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium">{service.type}</span>
                                            <span className="text-sm text-gray-500">{service.count} services ({service.percentage}%)</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                                className="bg-blue-600 h-2 rounded-full" 
                                                style={{width: `${service.percentage}%`}}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="performance" className="space-y-6">
                    {/* Weekly Hours */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                Weekly Work Hours
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {reports.weeklyHours.map((week, index) => (
                                    <div key={index} className="border rounded-lg p-4">
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-medium">{week.week}</h3>
                                            <div className="flex gap-6 text-sm">
                                                <div>
                                                    <span className="text-gray-500">Hours:</span>
                                                    <span className="font-medium ml-2">{week.hours}h</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Services:</span>
                                                    <span className="font-medium ml-2">{week.services}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Avg per Service:</span>
                                                    <span className="font-medium ml-2">{(week.hours / week.services).toFixed(1)}h</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Performance Metrics */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Performance Metrics</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className="font-medium">Service Quality</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Customer Rating</span>
                                            <span className="font-medium">{reports.performanceMetrics.averageRating}/5.0</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">On-time Delivery</span>
                                            <span className="font-medium">{reports.performanceMetrics.onTimeDelivery}%</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Service Completion</span>
                                            <span className="font-medium">
                                                {((reports.performanceMetrics.completedServices / reports.performanceMetrics.totalServices) * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    <h4 className="font-medium">Business Impact</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Total Revenue</span>
                                            <span className="font-medium">${reports.performanceMetrics.totalRevenue}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Customer Retention</span>
                                            <span className="font-medium">{reports.performanceMetrics.customerRetention}%</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Avg Service Value</span>
                                            <span className="font-medium">${(reports.performanceMetrics.totalRevenue / reports.performanceMetrics.totalServices).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="customers" className="space-y-6">
                    {/* Top Customers */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Top Customers
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {reports.topCustomers.map((customer, index) => (
                                    <div key={index} className="border rounded-lg p-4">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h3 className="font-medium">{customer.name}</h3>
                                                <div className="flex items-center gap-1 mt-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star 
                                                            key={i} 
                                                            className={`h-3 w-3 ${i < Math.floor(customer.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                                                        />
                                                    ))}
                                                    <span className="text-xs text-gray-500 ml-1">({customer.rating})</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm text-gray-500">{customer.services} services</div>
                                                <div className="font-medium text-green-600">${customer.revenue}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="exports" className="space-y-6">
                    {/* Export Options */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Download className="h-5 w-5" />
                                Export Reports
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className="font-medium">Performance Reports</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center p-3 border rounded-lg">
                                            <div>
                                                <h5 className="font-medium">Monthly Performance</h5>
                                                <p className="text-sm text-gray-600">Detailed monthly statistics</p>
                                            </div>
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => generateReport('monthly-performance')}
                                            >
                                                <FileText className="h-4 w-4 mr-2" />
                                                Export
                                            </Button>
                                        </div>
                                        
                                        <div className="flex justify-between items-center p-3 border rounded-lg">
                                            <div>
                                                <h5 className="font-medium">Service Summary</h5>
                                                <p className="text-sm text-gray-600">All services and ratings</p>
                                            </div>
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => generateReport('service-summary')}
                                            >
                                                <FileText className="h-4 w-4 mr-2" />
                                                Export
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    <h4 className="font-medium">Financial Reports</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center p-3 border rounded-lg">
                                            <div>
                                                <h5 className="font-medium">Earnings Report</h5>
                                                <p className="text-sm text-gray-600">Revenue and payment history</p>
                                            </div>
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => generateReport('earnings')}
                                            >
                                                <DollarSign className="h-4 w-4 mr-2" />
                                                Export
                                            </Button>
                                        </div>
                                        
                                        <div className="flex justify-between items-center p-3 border rounded-lg">
                                            <div>
                                                <h5 className="font-medium">Tax Summary</h5>
                                                <p className="text-sm text-gray-600">Year-end tax documentation</p>
                                            </div>
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => generateReport('tax-summary')}
                                            >
                                                <FileText className="h-4 w-4 mr-2" />
                                                Export
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Custom Report Builder */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Custom Report Builder</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-gray-50 p-8 rounded-lg text-center">
                                <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-600 mb-2">Custom Reports Coming Soon</h3>
                                <p className="text-gray-500 mb-4">
                                    Build custom reports with your preferred metrics, date ranges, and formats.
                                </p>
                                <Button variant="outline" disabled>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Build Custom Report
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
