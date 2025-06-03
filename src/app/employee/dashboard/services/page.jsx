"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Clock, User, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

export default function ServicesPage() {
    const [activeServices, setActiveServices] = useState([]);
    const [completedServices, setCompletedServices] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Fetch real services data from existing APIs
        const fetchServicesData = async () => {
            try {
                // Get active/scheduled services
                const activeResponse = await fetch('/api/employee/services?status=SCHEDULED', {
                    credentials: 'include',
                });
                
                // Get completed services history
                const historyResponse = await fetch('/api/employee/services/history', {
                    credentials: 'include',
                });
                
                // Get dashboard stats
                const dashboardResponse = await fetch('/api/employee/dashboard', {
                    credentials: 'include',
                });
                
                if (activeResponse.ok && historyResponse.ok && dashboardResponse.ok) {
                    const activeData = await activeResponse.json();
                    const historyData = await historyResponse.json();
                    const dashboardData = await dashboardResponse.json();
                    
                    // Format active services
                    const formattedActiveServices = (activeData || []).map(service => {
                        const serviceDate = new Date(service.scheduledDate || service.scheduledFor);
                        const now = new Date();
                        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                        const tomorrow = new Date(today);
                        tomorrow.setDate(today.getDate() + 1);
                        
                        let dateDisplay = 'Upcoming';
                        if (serviceDate >= today && serviceDate < tomorrow) {
                            dateDisplay = 'Today';
                        } else if (serviceDate >= tomorrow && serviceDate < new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)) {
                            dateDisplay = 'Tomorrow';
                        } else {
                            dateDisplay = serviceDate.toLocaleDateString();
                        }
                        
                        return {
                            id: service.id,
                            customer: service.customer?.user?.name || service.customer?.name || 'Unknown Customer',
                            address: service.customer?.address ? 
                                `${service.customer.address.street || ''}, ${service.customer.address.city || ''}, ${service.customer.address.state || ''} ${service.customer.address.zipCode || ''}`.trim().replace(/^,\s*/, '') :
                                'Address not available',
                            serviceType: service.serviceType || service.type || 'Pet Waste Cleanup',
                            scheduledTime: serviceDate.toLocaleTimeString([], { 
                                hour: 'numeric', 
                                minute: '2-digit',
                                hour12: true 
                            }),
                            date: dateDisplay,
                            status: (service.status || 'scheduled').toLowerCase(),
                            estimatedDuration: service.estimatedDuration ? `${service.estimatedDuration} min` : '30-45 min',
                            specialInstructions: service.specialInstructions || service.notes || 'No special instructions'
                        };
                    });
                    
                    // Format completed services
                    const formattedCompletedServices = (historyData || []).map(service => {
                        const completedDate = new Date(service.completedAt || service.updatedAt);
                        
                        return {
                            id: service.id,
                            customer: service.customer?.user?.name || service.customer?.name || 'Unknown Customer',
                            address: service.customer?.address ? 
                                `${service.customer.address.street || ''}, ${service.customer.address.city || ''}, ${service.customer.address.state || ''} ${service.customer.address.zipCode || ''}`.trim().replace(/^,\s*/, '') :
                                'Address not available',
                            serviceType: service.serviceType || service.type || 'Pet Waste Cleanup',
                            completedTime: completedDate.toLocaleTimeString([], { 
                                hour: 'numeric', 
                                minute: '2-digit',
                                hour12: true 
                            }),
                            date: completedDate.toLocaleDateString(),
                            status: 'completed',
                            duration: service.duration ? `${service.duration} min` : 'N/A',
                            rating: service.rating || 0,
                            notes: service.notes || 'No notes available'
                        };
                    });
                    
                    setActiveServices(formattedActiveServices);
                    setCompletedServices(formattedCompletedServices);
                    
                    // Set stats from dashboard
                    const dashboardStats = dashboardData.stats || {};
                    setStats({
                        activeServices: formattedActiveServices.length,
                        completedToday: formattedCompletedServices.filter(service => {
                            const serviceDate = new Date(service.date);
                            const today = new Date();
                            return serviceDate.toDateString() === today.toDateString();
                        }).length,
                        totalCustomers: dashboardStats.customerCount || 0,
                        serviceAreas: dashboardStats.serviceAreas?.length || 1
                    });
                } else {
                    console.error('Failed to fetch services data');
                    setError('Failed to load services data');
                    setActiveServices([]);
                    setCompletedServices([]);
                    setStats({
                        activeServices: 0,
                        completedToday: 0,
                        totalCustomers: 0,
                        serviceAreas: 0
                    });
                }
            } catch (error) {
                console.error('Error fetching services data:', error);
                setError('Failed to load services data');
                setActiveServices([]);
                setCompletedServices([]);
                setStats({
                    activeServices: 0,
                    completedToday: 0,
                    totalCustomers: 0,
                    serviceAreas: 0
                });
            } finally {
                setLoading(false);
            }
        };
        
        fetchServicesData();
    }, []);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'scheduled':
                return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Scheduled</Badge>;
            case 'in-progress':
                return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">In Progress</Badge>;
            case 'completed':
                return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
            case 'cancelled':
                return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'scheduled':
                return <Clock className="h-4 w-4 text-blue-600" />;
            case 'in-progress':
                return <AlertCircle className="h-4 w-4 text-yellow-600" />;
            case 'completed':
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 'cancelled':
                return <XCircle className="h-4 w-4 text-red-600" />;
            default:
                return <Clock className="h-4 w-4 text-gray-600" />;
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
                    <h1 className="text-2xl font-bold mb-2">Services</h1>
                    <p className="text-gray-600">Manage your active and completed services</p>
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
                <h1 className="text-2xl font-bold mb-2">Services</h1>
                <p className="text-gray-600">Manage your active and completed services</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <Clock className="h-8 w-8 text-blue-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Active Services</p>
                                <p className="text-2xl font-bold">{stats.activeServices || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Completed Today</p>
                                <p className="text-2xl font-bold">{stats.completedToday || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <User className="h-8 w-8 text-purple-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                                <p className="text-2xl font-bold">{stats.totalCustomers || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <MapPin className="h-8 w-8 text-orange-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Service Areas</p>
                                <p className="text-2xl font-bold">{stats.serviceAreas || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Services Tabs */}
            <Tabs defaultValue="active" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="active">Active Services ({activeServices.length})</TabsTrigger>
                    <TabsTrigger value="completed">Completed Services ({completedServices.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="space-y-4">
                    {activeServices.map((service) => (
                        <Card key={service.id}>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            {getStatusIcon(service.status)}
                                            <h3 className="text-lg font-semibold">{service.customer}</h3>
                                            {getStatusBadge(service.status)}
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                                    <MapPin className="h-4 w-4" />
                                                    <span>{service.address}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                                    <Clock className="h-4 w-4" />
                                                    <span>{service.date} at {service.scheduledTime}</span>
                                                </div>
                                                <p className="text-sm"><strong>Service:</strong> {service.serviceType}</p>
                                                <p className="text-sm"><strong>Duration:</strong> {service.estimatedDuration}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-700 mb-1">Special Instructions:</p>
                                                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                                    {service.specialInstructions}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col gap-2 ml-4">
                                        {service.status === 'scheduled' && (
                                            <Button size="sm">
                                                Start Service
                                            </Button>
                                        )}
                                        {service.status === 'in-progress' && (
                                            <Button size="sm" variant="outline" className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100">
                                                Complete Service
                                            </Button>
                                        )}
                                        <Button variant="outline" size="sm">
                                            View Details
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            Contact Customer
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {activeServices.length === 0 && (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <CheckCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-600 mb-2">No Active Services</h3>
                                <p className="text-gray-500">All services are completed or none are scheduled.</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="completed" className="space-y-4">
                    {completedServices.map((service) => (
                        <Card key={service.id}>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            {getStatusIcon(service.status)}
                                            <h3 className="text-lg font-semibold">{service.customer}</h3>
                                            {getStatusBadge(service.status)}
                                            <div className="flex items-center gap-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <span key={i} className={`text-sm ${i < service.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                                                        ★
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                                    <MapPin className="h-4 w-4" />
                                                    <span>{service.address}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                                    <Clock className="h-4 w-4" />
                                                    <span>Completed {service.date} at {service.completedTime}</span>
                                                </div>
                                                <p className="text-sm"><strong>Service:</strong> {service.serviceType}</p>
                                                <p className="text-sm"><strong>Duration:</strong> {service.duration}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-700 mb-1">Customer Notes:</p>
                                                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                                    {service.notes}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col gap-2 ml-4">
                                        <Button variant="outline" size="sm">
                                            View Details
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            Contact Customer
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {completedServices.length === 0 && (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-600 mb-2">No Completed Services</h3>
                                <p className="text-gray-500">Completed services will appear here.</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
