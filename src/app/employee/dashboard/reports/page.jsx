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
    DollarSign,
    AlertCircle
} from 'lucide-react';

export default function ReportsPage() {
    const [reports, setReports] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchReportsData = async () => {
            try {
                // Get dashboard data for comprehensive stats
                const dashboardResponse = await fetch('/api/employee/dashboard', {
                    credentials: 'include',
                });
                
                // Get all services for analysis
                const servicesResponse = await fetch('/api/employee/services', {
                    credentials: 'include',
                });
                
                // Get completed services for historical data
                const historyResponse = await fetch('/api/employee/services/history', {
                    credentials: 'include',
                });

                if (dashboardResponse.ok && servicesResponse.ok && historyResponse.ok) {
                    const dashboardData = await dashboardResponse.json();
                    const servicesData = await servicesResponse.json();
                    const historyData = await historyResponse.json();
                    
                    // Calculate performance metrics
                    const totalServices = (historyData || []).length;
                    const completedServices = (historyData || []).filter(s => s.status === 'COMPLETED').length;
                    const cancelledServices = totalServices - completedServices;
                    
                    // Calculate ratings
                    const ratingsData = (historyData || []).filter(s => s.rating);
                    const averageRating = ratingsData.length > 0 
                        ? ratingsData.reduce((sum, s) => sum + s.rating, 0) / ratingsData.length 
                        : 0;
                    
                    // Calculate revenue (example pricing)
                    const avgServicePrice = 45.00; // This would come from actual pricing data
                    const totalRevenue = completedServices * avgServicePrice;
                    
                    // Calculate average service time (example)
                    const avgServiceTime = 48; // This would be calculated from actual service duration data
                    
                    // Customer retention and on-time delivery would need specific tracking
                    const customerRetention = 92; // Placeholder
                    const onTimeDelivery = 96; // Placeholder
                    
                    // Group services by month for trends
                    const monthlyStats = {};
                    (historyData || []).forEach(service => {
                        const date = new Date(service.completedAt || service.updatedAt);
                        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                        
                        if (!monthlyStats[monthKey]) {
                            monthlyStats[monthKey] = {
                                services: 0,
                                revenue: 0,
                                ratings: []
                            };
                        }
                        
                        monthlyStats[monthKey].services += 1;
                        monthlyStats[monthKey].revenue += avgServicePrice;
                        if (service.rating) {
                            monthlyStats[monthKey].ratings.push(service.rating);
                        }
                    });
                    
                    // Convert to array and format
                    const monthlyData = Object.entries(monthlyStats)
                        .map(([month, data]) => ({
                            month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                            services: data.services,
                            revenue: data.revenue,
                            rating: data.ratings.length > 0 
                                ? data.ratings.reduce((sum, r) => sum + r, 0) / data.ratings.length 
                                : 0
                        }))
                        .sort((a, b) => new Date(a.month) - new Date(b.month))
                        .slice(-6); // Last 6 months
                    
                    // Extract top customers from service history
                    const customerStats = {};
                    (historyData || []).forEach(service => {
                        const customer = service.customer;
                        if (customer && customer.id) {
                            const customerId = customer.id;
                            const customerName = customer.user?.name || customer.name || 'Unknown Customer';
                            
                            if (!customerStats[customerId]) {
                                customerStats[customerId] = {
                                    name: customerName,
                                    services: 0,
                                    revenue: 0,
                                    ratings: []
                                };
                            }
                            
                            customerStats[customerId].services += 1;
                            customerStats[customerId].revenue += avgServicePrice;
                            if (service.rating) {
                                customerStats[customerId].ratings.push(service.rating);
                            }
                        }
                    });
                    
                    const topCustomers = Object.values(customerStats)
                        .map(customer => ({
                            ...customer,
                            rating: customer.ratings.length > 0 
                                ? customer.ratings.reduce((sum, r) => sum + r, 0) / customer.ratings.length 
                                : 0
                        }))
                        .sort((a, b) => b.services - a.services)
                        .slice(0, 5);
                    
                    // Analyze service types
                    const serviceTypeStats = {};
                    [...(servicesData || []), ...(historyData || [])].forEach(service => {
                        const type = service.serviceType || service.type || 'Pet Waste Cleanup';
                        serviceTypeStats[type] = (serviceTypeStats[type] || 0) + 1;
                    });
                    
                    const totalServiceCount = Object.values(serviceTypeStats).reduce((sum, count) => sum + count, 0);
                    const serviceTypes = Object.entries(serviceTypeStats)
                        .map(([type, count]) => ({
                            type,
                            count,
                            percentage: totalServiceCount > 0 ? Math.round((count / totalServiceCount) * 100) : 0
                        }))
                        .sort((a, b) => b.count - a.count);
                    
                    setReports({
                        performanceMetrics: {
                            totalServices,
                            completedServices,
                            cancelledServices,
                            averageRating: Math.round(averageRating * 10) / 10,
                            totalRevenue,
                            avgServiceTime,
                            customerRetention,
                            onTimeDelivery
                        },
                        monthlyData,
                        topCustomers,
                        serviceTypes,
                        weeklyHours: [] // Would need time tracking data
                    });
                } else {
                    console.error('Failed to fetch reports data');
                    setError('Failed to load reports data');
                    setReports({
                        performanceMetrics: {
                            totalServices: 0,
                            completedServices: 0,
                            cancelledServices: 0,
                            averageRating: 0,
                            totalRevenue: 0,
                            avgServiceTime: 0,
                            customerRetention: 0,
                            onTimeDelivery: 0
                        },
                        monthlyData: [],
                        topCustomers: [],
                        serviceTypes: [],
                        weeklyHours: []
                    });
                }
            } catch (error) {
                console.error('Error fetching reports data:', error);
                setError('Failed to load reports data');
                setReports({
                    performanceMetrics: {
                        totalServices: 0,
                        completedServices: 0,
                        cancelledServices: 0,
                        averageRating: 0,
                        totalRevenue: 0,
                        avgServiceTime: 0,
                        customerRetention: 0,
                        onTimeDelivery: 0
                    },
                    monthlyData: [],
                    topCustomers: [],
                    serviceTypes: [],
                    weeklyHours: []
                });
            } finally {
                setLoading(false);
            }
        };
        
        fetchReportsData();
    }, []);

    const generateReport = (reportType) => {
        // Simulate report generation
        console.log(`Generating ${reportType} report...`);
        alert(`${reportType} report would be generated and downloaded here.`);
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
                    <h1 className="text-2xl font-bold mb-2">Reports & Analytics</h1>
                    <p className="text-gray-600">Track your performance and business insights</p>
                </div>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-center">
                            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
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
                                    {reports.performanceMetrics.totalServices > 0 
                                        ? ((reports.performanceMetrics.completedServices / reports.performanceMetrics.totalServices) * 100).toFixed(1)
                                        : 0}%
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
                                <p className="text-2xl font-bold">{reports.performanceMetrics.averageRating || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <DollarSign className="h-8 w-8 text-green-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                                <p className="text-2xl font-bold">${reports.performanceMetrics.totalRevenue || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <Users className="h-8 w-8 text-purple-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Services</p>
                                <p className="text-2xl font-bold">{reports.performanceMetrics.totalServices || 0}</p>
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
                                                <span className="text-sm text-gray-500 ml-1">({month.rating?.toFixed(1) || 0})</span>
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
                                
                                {reports.monthlyData.length === 0 && (
                                    <div className="text-center p-8">
                                        <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-600 mb-2">No Monthly Data</h3>
                                        <p className="text-gray-500">Monthly performance data will appear here as you complete services.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Service Types Breakdown */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Service Types Breakdown
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {reports.serviceTypes.map((service, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div>
                                            <h4 className="font-medium">{service.type}</h4>
                                            <p className="text-sm text-gray-500">{service.count} services</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold">{service.percentage}%</p>
                                            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-blue-500 transition-all"
                                                    style={{ width: `${service.percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                
                                {reports.serviceTypes.length === 0 && (
                                    <div className="text-center p-8">
                                        <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-600 mb-2">No Service Data</h3>
                                        <p className="text-gray-500">Service breakdown will appear here as you complete services.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="performance" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Service Metrics</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Total Services</span>
                                        <span className="font-bold">{reports.performanceMetrics.totalServices}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Completed</span>
                                        <span className="font-bold text-green-600">{reports.performanceMetrics.completedServices}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Cancelled</span>
                                        <span className="font-bold text-red-600">{reports.performanceMetrics.cancelledServices}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Average Service Time</span>
                                        <span className="font-bold">{reports.performanceMetrics.avgServiceTime}min</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Quality Metrics</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Average Rating</span>
                                        <span className="font-bold">{reports.performanceMetrics.averageRating}/5</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Customer Retention</span>
                                        <span className="font-bold">{reports.performanceMetrics.customerRetention}%</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">On-Time Delivery</span>
                                        <span className="font-bold">{reports.performanceMetrics.onTimeDelivery}%</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Total Revenue</span>
                                        <span className="font-bold">${reports.performanceMetrics.totalRevenue}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="customers" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Top Customers</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {reports.topCustomers.map((customer, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                                                {customer.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div>
                                                <h4 className="font-medium">{customer.name}</h4>
                                                <p className="text-sm text-gray-500">{customer.services} services</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">${customer.revenue}</p>
                                            <div className="flex items-center gap-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star 
                                                        key={i} 
                                                        className={`h-3 w-3 ${i < Math.floor(customer.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                                                    />
                                                ))}
                                                <span className="text-xs text-gray-500 ml-1">({customer.rating?.toFixed(1) || 0})</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                
                                {reports.topCustomers.length === 0 && (
                                    <div className="text-center p-8">
                                        <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-600 mb-2">No Customer Data</h3>
                                        <p className="text-gray-500">Customer analytics will appear here as you complete services.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="exports" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Performance Reports</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Button 
                                    onClick={() => generateReport('Monthly Performance')}
                                    className="w-full justify-start"
                                    variant="outline"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Monthly Performance Report
                                </Button>
                                <Button 
                                    onClick={() => generateReport('Service Analytics')}
                                    className="w-full justify-start"
                                    variant="outline"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Service Analytics Report
                                </Button>
                                <Button 
                                    onClick={() => generateReport('Revenue')}
                                    className="w-full justify-start"
                                    variant="outline"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Revenue Report
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Customer Reports</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Button 
                                    onClick={() => generateReport('Customer Analytics')}
                                    className="w-full justify-start"
                                    variant="outline"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Customer Analytics
                                </Button>
                                <Button 
                                    onClick={() => generateReport('Service History')}
                                    className="w-full justify-start"
                                    variant="outline"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Service History Report
                                </Button>
                                <Button 
                                    onClick={() => generateReport('Rating Summary')}
                                    className="w-full justify-start"
                                    variant="outline"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Rating Summary
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
