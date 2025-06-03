"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, User } from 'lucide-react';

export default function SchedulePage() {
    const [upcomingServices, setUpcomingServices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate loading upcoming services
        setTimeout(() => {
            setUpcomingServices([
                {
                    id: 1,
                    customer: 'John Smith',
                    address: '123 Main St, Denver, CO 80831',
                    time: '9:00 AM',
                    date: 'Today',
                    service: 'Weekly Cleanup',
                    status: 'confirmed'
                },
                {
                    id: 2,
                    customer: 'Sarah Johnson',
                    address: '456 Oak Ave, Denver, CO 80831',
                    time: '2:00 PM',
                    date: 'Tomorrow',
                    service: 'One-time Cleanup',
                    status: 'pending'
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
                    <div className="h-32 bg-gray-200 rounded"></div>
                    <div className="h-32 bg-gray-200 rounded"></div>
                </div>
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
                                <p className="text-2xl font-bold">1</p>
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
                                <p className="text-2xl font-bold">5</p>
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
                                <p className="text-2xl font-bold">12</p>
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
                    <div className="bg-gray-50 p-8 rounded-lg text-center">
                        <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-600 mb-2">Full Calendar Coming Soon</h3>
                        <p className="text-gray-500">We're working on a comprehensive calendar view for better schedule management.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
