'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { 
    MapPin, 
    Clock, 
    DollarSign, 
    Navigation, 
    User,
    Calendar,
    Zap
} from 'lucide-react';

export default function AvailableJobsList({ employeeId }) {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [employeeLocation, setEmployeeLocation] = useState(null);

    useEffect(() => {
        fetchAvailableJobs();
        getCurrentLocation();
    }, []);

    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setEmployeeLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                },
                (error) => {
                    console.log('Location access denied or unavailable');
                }
            );
        }
    };

    const fetchAvailableJobs = async () => {
        try {
            setLoading(true);
            let url = '/api/employee/available-services';
            
            // Add location to query if available
            if (employeeLocation) {
                url += `?latitude=${employeeLocation.latitude}&longitude=${employeeLocation.longitude}`;
            }

            const response = await fetch(url, {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch available jobs');
            }

            const data = await response.json();
            setJobs(data.services || []);
            setError(null);
        } catch (err) {
            setError('Failed to load available jobs');
            console.error('Error fetching jobs:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleClaimJob = async (jobId) => {
        try {
            const response = await fetch(`/api/employee/services/${jobId}/claim`, {
                method: 'POST',
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to claim job');
            }

            const result = await response.json();
            toast.success('Job claimed successfully!');
            
            // Remove the claimed job from the list
            setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
            
            // Refresh the list
            fetchAvailableJobs();
        } catch (error) {
            toast.error(error.message || 'Failed to claim job');
            console.error('Error claiming job:', error);
        }
    };

    const getDistanceColor = (distance) => {
        if (!distance) return 'text-gray-500';
        if (distance <= 5) return 'text-green-600';
        if (distance <= 15) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getDistanceBadge = (distance) => {
        if (!distance) return 'bg-gray-100 text-gray-600';
        if (distance <= 5) return 'bg-green-100 text-green-800';
        if (distance <= 15) return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600">Loading available jobs...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
            </div>
        );
    }

    if (jobs.length === 0) {
        return (
            <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Zap className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs available</h3>
                <p className="text-gray-600">Check back later for new opportunities!</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Available Jobs ({jobs.length})</h2>
                <Button 
                    onClick={fetchAvailableJobs} 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-2"
                >
                    <Navigation className="w-4 h-4" />
                    Refresh
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {jobs.map((job) => (
                    <Card key={job.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <CardTitle className="text-lg">{job.customerName}</CardTitle>
                                {job.distance && (
                                    <Badge className={getDistanceBadge(job.distance)}>
                                        {job.distanceText}
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {/* Address */}
                            <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                <div className="text-sm">
                                    {job.address ? (
                                        <div>
                                            <p className="font-medium">{job.address.street}</p>
                                            <p className="text-gray-600">
                                                {job.address.city}, {job.address.state} {job.address.zipCode}
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500">Address not available</p>
                                    )}
                                </div>
                            </div>

                            {/* Service Details */}
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-700">
                                    {job.servicePlan?.name || 'Standard Service'}
                                </span>
                            </div>

                            {/* Scheduled Time */}
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-700">
                                    {format(new Date(job.scheduledDate), 'MMM d, h:mm a')}
                                </span>
                            </div>

                            {/* Estimated Earnings */}
                            <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-green-500" />
                                <span className="text-sm font-medium text-green-700">
                                    ${job.estimatedEarnings}
                                </span>
                            </div>

                            {/* Distance Information */}
                            {job.distance && (
                                <div className="flex items-center gap-2">
                                    <Navigation className="w-4 h-4 text-blue-500" />
                                    <span className={`text-sm font-medium ${getDistanceColor(job.distance)}`}>
                                        {job.distance <= 5 ? 'Very Close' : 
                                         job.distance <= 15 ? 'Nearby' : 'Further Away'}
                                    </span>
                                </div>
                            )}

                            {/* Claim Button */}
                            <Button 
                                onClick={() => handleClaimJob(job.id)}
                                className="w-full mt-3"
                                size="sm"
                            >
                                Claim This Job
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Location Status */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-blue-700">
                        {employeeLocation 
                            ? `Using your current location for accurate distance calculations`
                            : `Enable location access to see exact distances to jobs`
                        }
                    </span>
                </div>
                {!employeeLocation && (
                    <Button 
                        onClick={getCurrentLocation}
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                    >
                        Enable Location
                    </Button>
                )}
            </div>
        </div>
    );
}
