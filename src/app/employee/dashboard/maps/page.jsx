"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Clock, User, Route, Zap } from 'lucide-react';

export default function MapsPage() {
    const [serviceAreas, setServiceAreas] = useState([]);
    const [nearbyServices, setNearbyServices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate loading map data
        setTimeout(() => {
            setServiceAreas([
                {
                    id: 1,
                    zipCode: '80831',
                    area: 'Denver South',
                    isActive: true,
                    totalCustomers: 12,
                    todayServices: 3,
                    address: 'Colorado Springs, CO 80831'
                }
            ]);

            setNearbyServices([
                {
                    id: 1,
                    customer: 'John Smith',
                    address: '123 Main St, Denver, CO 80831',
                    distance: '0.5 miles',
                    scheduledTime: '9:00 AM',
                    status: 'scheduled',
                    serviceType: 'Weekly Cleanup',
                    estimatedDuration: '45 min'
                },
                {
                    id: 2,
                    customer: 'Sarah Johnson',
                    address: '456 Oak Ave, Denver, CO 80831',
                    distance: '1.2 miles',
                    scheduledTime: '2:00 PM',
                    status: 'in-progress',
                    serviceType: 'One-time Cleanup',
                    estimatedDuration: '60 min'
                },
                {
                    id: 3,
                    customer: 'Mike Wilson',
                    address: '789 Pine Rd, Denver, CO 80831',
                    distance: '2.1 miles',
                    scheduledTime: '10:00 AM',
                    status: 'scheduled',
                    serviceType: 'Bi-weekly Cleanup',
                    estimatedDuration: '30 min'
                }
            ]);
            setLoading(false);
        }, 1000);
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
                                <p className="text-2xl font-bold">{serviceAreas.filter(area => area.isActive).length}</p>
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
                                <p className="text-2xl font-bold">{serviceAreas.reduce((sum, area) => sum + area.totalCustomers, 0)}</p>
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
                                <p className="text-2xl font-bold">{serviceAreas.reduce((sum, area) => sum + area.todayServices, 0)}</p>
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
                                <p className="text-2xl font-bold">1.3mi</p>
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
                        </div>
                    </CardContent>
                </Card>

                {/* Nearby Services */}
                <Card>
                    <CardHeader>
                        <CardTitle>Nearby Services Today</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {nearbyServices.map((service) => (
                                <div key={service.id} className="border rounded-lg p-4 hover:bg-gray-50">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-medium">{service.customer}</h3>
                                        <Badge variant={service.status === 'in-progress' ? "default" : "outline"}>
                                            {service.status === 'in-progress' ? 'Active' : 'Scheduled'}
                                        </Badge>
                                    </div>
                                    
                                    <div className="space-y-1 text-sm text-gray-600 mb-3">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-3 w-3" />
                                            <span>{service.address}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Navigation className="h-3 w-3" />
                                            <span>{service.distance} away</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-3 w-3" />
                                            <span>{service.scheduledTime} ({service.estimatedDuration})</span>
                                        </div>
                                    </div>
                                    
                                    <p className="text-sm text-gray-500 mb-3">{service.serviceType}</p>
                                    
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm">
                                            <Navigation className="h-3 w-3 mr-1" />
                                            Navigate
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            Details
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Route Optimization Tools */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Route className="h-5 w-5" />
                        Route Optimization Tools
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-6 border rounded-lg hover:bg-gray-50">
                            <Zap className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
                            <h3 className="font-medium mb-2">Auto-Optimize</h3>
                            <p className="text-sm text-gray-600 mb-4">Automatically plan the most efficient route for your daily services</p>
                            <Button variant="outline" size="sm">
                                Optimize Routes
                            </Button>
                        </div>
                        
                        <div className="text-center p-6 border rounded-lg hover:bg-gray-50">
                            <Navigation className="h-12 w-12 text-blue-500 mx-auto mb-3" />
                            <h3 className="font-medium mb-2">Turn-by-Turn</h3>
                            <p className="text-sm text-gray-600 mb-4">Get detailed navigation instructions for each service location</p>
                            <Button variant="outline" size="sm">
                                Start Navigation
                            </Button>
                        </div>
                        
                        <div className="text-center p-6 border rounded-lg hover:bg-gray-50">
                            <Clock className="h-12 w-12 text-green-500 mx-auto mb-3" />
                            <h3 className="font-medium mb-2">Time Estimates</h3>
                            <p className="text-sm text-gray-600 mb-4">View accurate travel time estimates between service locations</p>
                            <Button variant="outline" size="sm">
                                View Estimates
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
