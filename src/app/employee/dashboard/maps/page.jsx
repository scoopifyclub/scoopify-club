"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Clock, User, Route, Zap, AlertCircle } from 'lucide-react';

export default function MapsPage() {
    const [serviceAreas, setServiceAreas] = useState([]);
    const [nearbyServices, setNearbyServices] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMapsData = async () => {
            try {
                // Get dashboard data for stats
                const dashboardResponse = await fetch('/api/employee/dashboard', {
                    credentials: 'include',
                });
                
                // Get service areas
                const serviceAreaResponse = await fetch('/api/employee/service-area', {
                    credentials: 'include',
                });
                
                // Get scheduled services for today/nearby
                const servicesResponse = await fetch('/api/employee/services?status=SCHEDULED', {
                    credentials: 'include',
                });

                if (dashboardResponse.ok && serviceAreaResponse.ok && servicesResponse.ok) {
                    const dashboardData = await dashboardResponse.json();
                    const serviceAreaData = await serviceAreaResponse.json();
                    const servicesData = await servicesResponse.json();
                    
                    // Format service areas
                    const formattedServiceAreas = (serviceAreaData || []).map(area => ({
                        id: area.id,
                        zipCode: area.zipCode || area.zip || 'N/A',
                        area: area.name || area.area || `Area ${area.zipCode || area.zip}`,
                        isActive: area.isActive !== false,
                        totalCustomers: area.customerCount || area.totalCustomers || 0,
                        todayServices: area.todayServices || 0,
                        address: area.address || (area.zipCode ? `${area.city || 'Unknown City'}, ${area.state || 'CO'} ${area.zipCode}` : 'Address not available')
                    }));
                    
                    // Format nearby services (today's scheduled services)
                    const today = new Date().toDateString();
                    const todayServices = (servicesData || []).filter(service => {
                        const serviceDate = new Date(service.scheduledDate || service.scheduledFor);
                        return serviceDate.toDateString() === today;
                    });
                    
                    const formattedNearbyServices = todayServices.map(service => {
                        const serviceDate = new Date(service.scheduledDate || service.scheduledFor);
                        
                        return {
                            id: service.id,
                            customer: service.customer?.user?.name || service.customer?.name || 'Unknown Customer',
                            address: service.customer?.address ? 
                                `${service.customer.address.street || ''}, ${service.customer.address.city || ''}, ${service.customer.address.state || ''} ${service.customer.address.zipCode || ''}`.trim().replace(/^,\s*/, '') :
                                'Address not available',
                            distance: service.distance || 'N/A',
                            scheduledTime: serviceDate.toLocaleTimeString([], { 
                                hour: 'numeric', 
                                minute: '2-digit',
                                hour12: true 
                            }),
                            status: (service.status || 'scheduled').toLowerCase(),
                            serviceType: service.serviceType || service.type || 'Pet Waste Cleanup',
                            estimatedDuration: service.estimatedDuration ? `${service.estimatedDuration} min` : '30-45 min'
                        };
                    });
                    
                    setServiceAreas(formattedServiceAreas);
                    setNearbyServices(formattedNearbyServices);
                    
                    // Set stats from dashboard
                    const dashboardStats = dashboardData.stats || {};
                    setStats({
                        activeAreas: formattedServiceAreas.filter(area => area.isActive).length,
                        totalCustomers: dashboardStats.customerCount || 0,
                        todayServices: formattedNearbyServices.length,
                        avgDistance: '1.3mi' // This would need to be calculated from actual service locations
                    });
                } else {
                    console.error('Failed to fetch maps data');
                    setError('Failed to load maps data');
                    setServiceAreas([]);
                    setNearbyServices([]);
                    setStats({
                        activeAreas: 0,
                        totalCustomers: 0,
                        todayServices: 0,
                        avgDistance: '0mi'
                    });
                }
            } catch (error) {
                console.error('Error fetching maps data:', error);
                setError('Failed to load maps data');
                setServiceAreas([]);
                setNearbyServices([]);
                setStats({
                    activeAreas: 0,
                    totalCustomers: 0,
                    todayServices: 0,
                    avgDistance: '0mi'
                });
            } finally {
                setLoading(false);
            }
        };
        
        fetchMapsData();
    }, []);

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                    <div className="h-32 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold mb-2">Maps & Route Planning</h1>
                    <p className="text-gray-600">View your service areas and plan optimal routes</p>
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
                <h1 className="text-2xl font-bold mb-2">Maps & Route Planning</h1>
                <p className="text-gray-600">View your service areas and plan optimal routes</p>
            </div>

            {/* Service Area Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <MapPin className="h-8 w-8 text-blue-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Active Areas</p>
                                <p className="text-2xl font-bold">{stats.activeAreas || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <User className="h-8 w-8 text-green-600" />
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
                            <Clock className="h-8 w-8 text-purple-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Today's Services</p>
                                <p className="text-2xl font-bold">{stats.todayServices || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <Route className="h-8 w-8 text-orange-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Avg Distance</p>
                                <p className="text-2xl font-bold">{stats.avgDistance || '0mi'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Interactive Map Placeholder */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            Interactive Service Map
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-gradient-to-br from-blue-50 to-green-50 p-12 rounded-lg text-center border-2 border-dashed border-blue-200">
                            <MapPin className="h-24 w-24 text-blue-400 mx-auto mb-6" />
                            <h3 className="text-xl font-semibold text-gray-700 mb-3">Interactive Map Coming Soon</h3>
                            <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                We're building a comprehensive map interface with route optimization, 
                                real-time navigation, and service area visualization.
                            </p>
                            <div className="flex justify-center gap-4">
                                <Button variant="outline">
                                    <Navigation className="h-4 w-4 mr-2" />
                                    Plan Route
                                </Button>
                                <Button variant="outline">
                                    <Zap className="h-4 w-4 mr-2" />
                                    Optimize Path
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Service Areas */}
                <Card>
                    <CardHeader>
                        <CardTitle>Your Service Areas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {serviceAreas.map((area) => (
                                <div key={area.id} className="border rounded-lg p-4 hover:bg-gray-50">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold">{area.area}</h3>
                                                <Badge variant={area.isActive ? "default" : "secondary"}>
                                                    {area.isActive ? "Active" : "Inactive"}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-2">ZIP: {area.zipCode}</p>
                                            <p className="text-sm text-gray-500">{area.address}</p>
                                        </div>
                                        <Button variant="outline" size="sm">
                                            <MapPin className="h-3 w-3 mr-1" />
                                            View
                                        </Button>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-500">Customers:</span>
                                            <span className="font-medium ml-1">{area.totalCustomers}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Today:</span>
                                            <span className="font-medium ml-1">{area.todayServices} services</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            {serviceAreas.length === 0 && (
                                <div className="text-center p-8">
                                    <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-600 mb-2">No Service Areas</h3>
                                    <p className="text-gray-500">Service areas will appear here when assigned.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Nearby Services */}
                <Card>
                    <CardHeader>
                        <CardTitle>Today's Services</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {nearbyServices.map((service) => (
                                <div key={service.id} className="border rounded-lg p-4 hover:bg-gray-50">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-semibold">{service.customer}</h3>
                                            <p className="text-sm text-gray-600 mb-1">{service.address}</p>
                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                                {service.distance !== 'N/A' && (
                                                    <span className="flex items-center gap-1">
                                                        <Route className="h-3 w-3" />
                                                        {service.distance}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {service.scheduledTime}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant="outline" className="mb-2">
                                                {service.status}
                                            </Badge>
                                            <p className="text-xs text-gray-500">{service.estimatedDuration}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm">
                                            <Navigation className="h-3 w-3 mr-1" />
                                            Navigate
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            <User className="h-3 w-3 mr-1" />
                                            Contact
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            
                            {nearbyServices.length === 0 && (
                                <div className="text-center p-8">
                                    <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-600 mb-2">No Services Today</h3>
                                    <p className="text-gray-500">Today's scheduled services will appear here.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
