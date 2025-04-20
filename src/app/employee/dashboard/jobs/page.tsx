'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
  DollarSignIcon,
  PawPrintIcon,
  Navigation,
  RefreshCw,
} from 'lucide-react';
import { getCurrentLocation } from '@/lib/geolocation';

interface AvailableJob {
  id: string;
  scheduledDate: string;
  type: string;
  potentialEarnings: number;
  distance?: number;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  customer: {
    name: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
    gateCode?: string;
  };
  servicePlan: {
    name: string;
    price: number;
    duration: number;
  };
}

export default function JobsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [jobs, setJobs] = useState<AvailableJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaimingJob] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/employee/dashboard/jobs');
      return;
    }
    
    // Verify user is an employee
    if (status === 'authenticated' && session?.user?.role !== 'EMPLOYEE') {
      router.push('/');
      return;
    }

    // Get user's location for proximity calculation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          fetchAvailableJobs(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
          fetchAvailableJobs(); // Fetch without location if permission denied
        }
      );
    } else {
      fetchAvailableJobs(); // Fetch without location if geolocation not supported
    }
  }, [status, session, router]);

  const fetchAvailableJobs = async (latitude?: number, longitude?: number) => {
    try {
      setLoading(true);
      setError(null);
      
      // Build the API URL with location parameters if available
      let url = '/api/employee/available-services';
      if (latitude && longitude) {
        url += `?latitude=${latitude}&longitude=${longitude}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session?.user?.accessToken}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch available jobs');
      }
      
      const data = await response.json();
      setJobs(data);
    } catch (err) {
      setError('Failed to load available jobs');
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimJob = async (jobId: string) => {
    try {
      setClaimingJob(jobId);
      
      const response = await fetch(`/api/employee/services/${jobId}/claim`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.user?.accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to claim job');
      }
      
      toast.success('Job claimed successfully! Check your schedule for details.');
      
      // Refresh the jobs list
      await fetchAvailableJobs(
        userLocation?.latitude,
        userLocation?.longitude
      );
      
      // Redirect to schedule page after successful claim
      router.push('/employee/dashboard/schedule');
    } catch (err) {
      toast.error('Failed to claim job. Please try again.');
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

  const formatAddress = (job: AvailableJob) => {
    const address = job.customer.address;
    return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;
  };

  const getDirectionsUrl = (job: AvailableJob) => {
    if (job.location) {
      return `https://www.google.com/maps/dir/?api=1&destination=${job.location.latitude},${job.location.longitude}`;
    } else {
      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(formatAddress(job))}`;
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Available Jobs</h1>
          <p className="text-gray-500">
            {jobs.length} jobs available in your service area
          </p>
          <p className="text-sm text-gray-400">
            Available from 7am to 7pm today
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={refreshLocation}
            disabled={loading}
          >
            <Navigation className="h-4 w-4 mr-2" />
            Update Location
          </Button>
          <Button 
            onClick={() => fetchAvailableJobs(
              userLocation?.latitude,
              userLocation?.longitude
            )}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{format(new Date(job.scheduledDate), 'EEEE, MMM d')}</CardTitle>
                    <CardDescription>
                      {format(new Date(job.scheduledDate), 'h:mm a')}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      ${job.potentialEarnings.toFixed(2)}
                    </Badge>
                    {job.distance && (
                      <Badge variant="outline" className="text-gray-500">
                        {job.distance} mi
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-2">
                  <MapPinIcon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{job.customer.name}</p>
                    <p className="text-sm text-gray-500">{formatAddress(job)}</p>
                    {job.customer.gateCode && (
                      <p className="text-sm text-gray-500">
                        Gate code: {job.customer.gateCode}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-5 w-5 text-gray-400" />
                  <p className="text-sm">Est. {job.servicePlan.duration} minutes</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <DollarSignIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-green-600">
                      Earn ${job.potentialEarnings.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      75% after processing fees
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(getDirectionsUrl(job), '_blank')}
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Directions
                </Button>
                <Button
                  onClick={() => handleClaimJob(job.id)}
                  disabled={claiming === job.id}
                  className="flex-1"
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
            <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No jobs available at the moment.</p>
              <p className="text-gray-400 text-sm mt-2">Check back later for new opportunities.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 