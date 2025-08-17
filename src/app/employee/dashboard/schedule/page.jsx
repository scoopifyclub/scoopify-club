"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, User, AlertCircle } from 'lucide-react';

export default function SchedulePage() {
    const [upcomingServices, setUpcomingServices] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Fetch real schedule data from existing APIs
        const fetchScheduleData = async () => {
            try {
                // Get overall stats from dashboard API
                const dashboardResponse = await fetch('/api/employee/dashboard', {
                    credentials: 'include',
                });
                
                // Get upcoming services from services API  
                const servicesResponse = await fetch('/api/employee/services?status=SCHEDULED', {
                    credentials: 'include',
                });
                
                if (dashboardResponse.ok && servicesResponse.ok) {
                    const dashboardData = await dashboardResponse.json();
                    const servicesData = await servicesResponse.json();
                    
                    // Extract stats from dashboard
                    const stats = dashboardData.stats || {};
                    setStats({
                        todayServices: 0, // Would need to calculate from services
                        thisWeekServices: 0, // Would need to calculate from services
                        totalCustomers: stats.customerCount || 0
                    });
                    
                    // Format services data
                    const formattedServices = (servicesData || []).map(service => {
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
                            time: serviceDate.toLocaleTimeString([], { 
                                hour: 'numeric', 
                                minute: '2-digit',
                                hour12: true 
                            }),
                            date: dateDisplay,
                            service: service.serviceType || service.type || 'Pet Waste Cleanup',
                            status: (service.status || 'scheduled').toLowerCase(),
                            scheduledDate: service.scheduledDate || service.scheduledFor,
                            price: service.price || 0
                        };
                    });
                    
                    setUpcomingServices(formattedServices);
                } else {
                    console.error('Failed to fetch schedule data');
                    setError('Failed to load schedule data');
                    setUpcomingServices([]);
                    setStats({
                        todayServices: 0,
                        thisWeekServices: 0,
                        totalCustomers: 0
                    });
                }
            } catch (error) {
                console.error('Error fetching schedule data:', error);
                setError('Failed to load schedule data');
                setUpcomingServices([]);
                setStats({
                    todayServices: 0,
                    thisWeekServices: 0,
                    totalCustomers: 0
                });
            } finally {
                setLoading(false);
            }
        };
        
        fetchScheduleData();
    }, []);

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
                    <h1 className="text-2xl font-bold mb-2">Schedule</h1>
                    <p className="text-gray-600">Manage your upcoming service appointments</p>
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
                <h1 className="text-2xl font-bold mb-2">Schedule</h1>
                <p className="text-gray-600">Manage your upcoming service appointments</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <Calendar className="h-8 w-8 text-blue-600" />
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
                            <Clock className="h-8 w-8 text-green-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">This Week</p>
                                <p className="text-2xl font-bold">{stats.thisWeekServices || 0}</p>
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
            </div>

            {/* Upcoming Services */}
            <Card>
                <CardHeader>
                    <CardTitle>Upcoming Services</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {upcomingServices.map((service) => (
                            <div key={service.id} className="border rounded-lg p-4 hover:bg-gray-50">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <User className="h-4 w-4 text-gray-500" />
                                            <span className="font-medium">{service.customer}</span>
                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                                service.status === 'confirmed' 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {service.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                            <MapPin className="h-4 w-4" />
                                            <span>{service.address}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Clock className="h-4 w-4" />
                                            <span>{service.date} at {service.time}</span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">{service.service}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm">
                                            View Details
                                        </Button>
                                        <Button size="sm">
                                            Start Service
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {upcomingServices.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            No upcoming services scheduled
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Calendar View */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Calendar View</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Weekly Calendar */}
                        <div className="grid grid-cols-7 gap-2 text-sm">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day} className="text-center font-medium text-gray-600 p-2">
                                    {day}
                                </div>
                            ))}
                            
                            {/* Calendar Days */}
                            {Array.from({ length: 35 }, (_, i) => {
                                const date = new Date();
                                date.setDate(date.getDate() - date.getDay() + i);
                                const dayServices = upcomingServices.filter(service => {
                                    const serviceDate = new Date(service.date);
                                    return serviceDate.toDateString() === date.toDateString();
                                });
                                
                                return (
                                    <div key={i} className={`min-h-[60px] p-2 border rounded-lg ${
                                        date.toDateString() === new Date().toDateString() 
                                            ? 'bg-blue-50 border-blue-200' 
                                            : 'bg-gray-50'
                                    }`}>
                                        <div className="text-xs text-gray-500 mb-1">
                                            {date.getDate()}
                                        </div>
                                        {dayServices.map((service, idx) => (
                                            <div key={idx} className="text-xs bg-green-100 text-green-800 p-1 rounded mb-1 truncate">
                                                {service.customer}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                        
                        <div className="text-center text-sm text-gray-500 mt-4">
                            <Calendar className="h-4 w-4 inline mr-2" />
                            Weekly calendar view - Click on services to view details
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
