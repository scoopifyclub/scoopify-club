'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { MapPin, Search, Navigation, Route, CalendarDays, ArrowRight, List, Grid } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const fetcher = (...args) => fetch(...args).then(res => res.json());

export default function MapsPage() {
    const router = useRouter();
    const { data: session, status } = useSession({
        required: true,
        onUnauthenticated() {
            router.push('/auth/login?callbackUrl=/employee/dashboard/maps');
        }
    });

    const [isClient, setIsClient] = useState(false);
    const [viewMode, setViewMode] = useState('map');
    const [searchTerm, setSearchTerm] = useState('');
    
    const { data: locations, error, isLoading, mutate } = useSWR(
        session ? '/api/services/available' : null,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false
        }
    );

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return null;
    }

    if (status === 'loading' || isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4">
                <p className="text-red-500">Error loading locations. Please try again later.</p>
            </div>
        );
    }

    const filteredLocations = locations?.filter(location => 
        location.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'upcoming':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Routes & Yards</h1>
                    <p className="text-gray-500">
                        View your service locations and optimized routes
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button 
                        variant={viewMode === 'map' ? 'default' : 'outline'} 
                        size="sm" 
                        onClick={() => setViewMode('map')}
                    >
                        <Grid className="h-4 w-4 mr-2"/>
                        Map View
                    </Button>
                    <Button 
                        variant={viewMode === 'list' ? 'default' : 'outline'} 
                        size="sm" 
                        onClick={() => setViewMode('list')}
                    >
                        <List className="h-4 w-4 mr-2"/>
                        List View
                    </Button>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4"/>
                    <Input 
                        placeholder="Search locations, customers, addresses..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        className="pl-10"
                    />
                </div>
                <div className="flex gap-2">
                    <div className="flex items-center bg-white border rounded-md px-3">
                        <CalendarDays className="h-4 w-4 text-gray-500 mr-2"/>
                        <input 
                            type="date" 
                            value={new Date().toISOString().split('T')[0]} 
                            onChange={(e) => {}} 
                            className="border-none focus:outline-none"
                        />
                    </div>
                    <Button variant="default">
                        <Route className="h-4 w-4 mr-2"/>
                        Optimize Route
                    </Button>
                </div>
            </div>

            {viewMode === 'map' ? (
                /* Map View - In a real app, you would integrate with a map library like Google Maps */
                <Card className="h-[500px] flex items-center justify-center bg-gray-100">
                    <div className="text-center p-8">
                        <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4"/>
                        <h3 className="text-lg font-medium text-gray-900">Map View</h3>
                        <p className="text-gray-500 max-w-md mx-auto">
                            This is where a map would be displayed. In a real application, this would integrate with 
                            Google Maps, Mapbox, or another mapping service to show your service locations and optimized routes.
                        </p>
                    </div>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filteredLocations.map(location => (
                        <Card key={location.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row md:items-center gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-lg font-semibold">{location.name}</h3>
                                            <Badge variant="outline" className={getStatusColor(location.status)}>
                                                {location.status}
                                            </Badge>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2 text-sm text-gray-500">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4"/>
                                                {location.address}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span>{location.customerName}</span>
                                                <span>{location.appointmentTime}</span>
                                            </div>
                                            <div>
                                                <Badge variant="outline">{location.serviceType}</Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm">
                                            <Navigation className="h-4 w-4 mr-2"/>
                                            Directions
                                        </Button>
                                        <Button variant="default" size="sm">
                                            View Details
                                            <ArrowRight className="h-4 w-4 ml-2"/>
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {filteredLocations.length === 0 && (
                        <div className="text-center py-12">
                            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4"/>
                            <h3 className="text-lg font-medium text-gray-900">No locations found</h3>
                            <p className="text-gray-500">
                                Try adjusting your search to find what you're looking for.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Route Summary */}
            <Card>
                <CardHeader>
                    <CardTitle>Today's Route</CardTitle>
                    <CardDescription>Your optimized route for today's appointments</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center">
                                <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2">
                                    {locations?.filter(loc => loc.status === 'completed').length}
                                </span>
                                <span>Completed</span>
                            </div>
                            <div className="flex items-center">
                                <span className="bg-yellow-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2">
                                    {locations?.filter(loc => loc.status === 'pending').length}
                                </span>
                                <span>In Progress</span>
                            </div>
                            <div className="flex items-center">
                                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2">
                                    {locations?.filter(loc => loc.status === 'upcoming').length}
                                </span>
                                <span>Upcoming</span>
                            </div>
                            <div className="flex items-center">
                                <span className="bg-gray-200 text-gray-700 rounded-full w-6 h-6 flex items-center justify-center mr-2">
                                    {locations?.length}
                                </span>
                                <span>Total Stops</span>
                            </div>
                        </div>
                        
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-blue-500" 
                                style={{
                                    width: `${(locations?.filter(loc => loc.status === 'completed').length / locations?.length) * 100}%`
                                }}
                            ></div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
