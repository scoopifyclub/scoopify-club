'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { MapPinIcon, ClockIcon, DollarSignIcon, Navigation, RefreshCw } from 'lucide-react';
import { getCurrentLocation } from '@/lib/geolocation';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export default function JobsList({ user }) {
    const router = useRouter();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaimingJob] = useState(null);
    const [error, setError] = useState(null);
    const [userLocation, setUserLocation] = useState(null);

    useEffect(() => {
        const initializeLocation = async () => {
            try {
                const position = await getCurrentLocation();
                setUserLocation(position);
                await fetchAvailableJobs(position.latitude, position.longitude);
            } catch (error) {
                console.error('Error getting location:', error);
                await fetchAvailableJobs(); // Fetch without location if permission denied
            }
        };

        if (user) {
            initializeLocation();
        }
    }, [user]);

    const fetchAvailableJobs = async (latitude, longitude) => {
        try {
            setLoading(true);
            setError(null);
            
            let url = '/api/employee/available-services';
            if (latitude && longitude) {
                url += `?latitude=${latitude}&longitude=${longitude}`;
            }

            const response = await fetch(url);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                if (response.status === 403 && errorData.error && errorData.error.includes('onboarding')) {
                    setError('onboarding');
                    setJobs([]);
                    setLoading(false);
                    return;
                }
                throw new Error(errorData.message || errorData.error || 'Failed to fetch available jobs');
            }

            const data = await response.json();
            setJobs(data);
        } catch (err) {
            setError(err.message || 'Failed to load available jobs');
            toast.error(err.message || 'Failed to load available jobs');
            console.error('Error fetching jobs:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleClaimJob = async (jobId) => {
        try {
            setClaimingJob(jobId);
            const response = await fetch(`/api/employee/services/${jobId}/claim`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to claim job');
            }

            toast.success('Job claimed successfully! Check your schedule for details.');
            // Refresh the jobs list
            await fetchAvailableJobs(userLocation?.latitude, userLocation?.longitude);
            // Redirect to schedule page after successful claim
            router.push('/employee/dashboard/schedule');
        } catch (err) {
            toast.error(err.message || 'Failed to claim job. Please try again.');
            console.error('Error claiming job:', err);
        } finally {
            setClaimingJob(null);
        }
    };

    const refreshLocation = async () => {
        try {
            const position = await getCurrentLocation();
            setUserLocation(position);
            fetchAvailableJobs(position.latitude, position.longitude);
            toast.success('Location updated');
        } catch (error) {
            toast.error('Could not get your location');
            fetchAvailableJobs();
        }
    };

    const formatAddress = (job) => {
        const address = job.customer.address;
        return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;
    };

    const getDirectionsUrl = (job) => {
        if (job.location) {
            return `https://www.google.com/maps/dir/?api=1&destination=${job.location.latitude},${job.location.longitude}`;
        } else {
            return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(formatAddress(job))}`;
        }
    };

    return (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Available Jobs</h1>
                    <p className="text-gray-500">
                        {jobs.length} jobs available in your service area
                    </p>
                    <p className="text-sm text-gray-400">
                        Available from 7am to 7pm today
                    </p>
                </div>
                <div className="flex w-full sm:w-auto gap-2">
                    <Button
                        variant="outline"
                        onClick={refreshLocation}
                        disabled={loading}
                        className="flex-1 sm:flex-initial"
                        size="sm"
                    >
                        <Navigation className="h-4 w-4 mr-2" />
                        <span className="sm:inline">Update Location</span>
                    </Button>
                    <Button
                        onClick={() => fetchAvailableJobs(userLocation?.latitude, userLocation?.longitude)}
                        disabled={loading}
                        className="flex-1 sm:flex-initial"
                        size="sm"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        <span className="sm:inline">Refresh</span>
                    </Button>
                </div>
            </div>

            {error === 'onboarding' ? (
                <div className="mb-4 sm:mb-6 bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-2 sm:px-4 sm:py-3 rounded text-base font-semibold text-center">
                    🚧 <br />
                    <span className="block mt-2">You must set up your service area before you can view or claim jobs.<br />
                    Please complete onboarding in your profile or settings.</span>
                    <a href="/employee/dashboard/profile" className="inline-block mt-4">
                        <button className="px-5 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 font-semibold transition-colors">
                            Set Up Service Area
                        </button>
                    </a>
                </div>
            ) : error && (
                <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 text-red-700 px-3 py-2 sm:px-4 sm:py-3 rounded text-sm">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center items-center py-8 sm:py-12">
                    <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {jobs.map((job) => (
                        <Card key={job.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-0 sm:pb-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-base sm:text-lg">
                                            {format(new Date(job.scheduledDate), 'EEE, MMM d')}
                                        </CardTitle>
                                        <CardDescription>
                                            {format(new Date(job.scheduledDate), 'h:mm a')}
                                        </CardDescription>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 sm:gap-2">
                                        <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs sm:text-sm">
                                            ${job.potentialEarnings.toFixed(2)}
                                        </Badge>
                                        {job.distance && (
                                            <Badge variant="outline" className="text-gray-500 text-xs sm:text-sm">
                                                {job.distance} mi
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="py-3 space-y-3">
                                <div className="flex items-start gap-2">
                                    <MapPinIcon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-sm sm:text-base">{job.customer.name}</p>
                                        <p className="text-xs sm:text-sm text-gray-500">{formatAddress(job)}</p>
                                        {job.customer.gateCode && (
                                            <p className="text-xs sm:text-sm text-gray-500">
                                                Gate code: {job.customer.gateCode}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2">
                                    <div className="flex items-center gap-2">
                                        <ClockIcon className="h-4 w-4 text-gray-400" />
                                        <p className="text-xs sm:text-sm">Est. {job.servicePlan.duration} mins</p>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <DollarSignIcon className="h-4 w-4 text-gray-400" />
                                        <div>
                                            <p className="text-xs sm:text-sm font-medium text-green-600">
                                                Earn ${job.potentialEarnings.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col sm:flex-row gap-2 pt-0">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(getDirectionsUrl(job), '_blank')}
                                    className="w-full sm:w-auto text-xs sm:text-sm"
                                >
                                    <Navigation className="h-4 w-4 mr-2" />
                                    Directions
                                </Button>
                                <Button
                                    onClick={() => handleClaimJob(job.id)}
                                    disabled={claiming === job.id}
                                    className="w-full text-xs sm:text-sm"
                                    size="sm"
                                >
                                    {claiming === job.id ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Claiming...
                                        </>
                                    ) : (
                                        'Claim Job'
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                    
                    {jobs.length === 0 && !loading && (
                        <div className="col-span-full text-center py-8 sm:py-12 bg-gray-50 rounded-lg">
                            <p className="text-gray-500">No jobs available at the moment.</p>
                            <p className="text-gray-400 text-xs sm:text-sm mt-2">
                                Check back later for new opportunities.
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-4"
                                onClick={() => fetchAvailableJobs(userLocation?.latitude, userLocation?.longitude)}
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
} 