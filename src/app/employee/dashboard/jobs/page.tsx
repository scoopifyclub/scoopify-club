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
} from 'lucide-react';

interface AvailableJob {
  id: string;
  scheduledFor: string;
  type: 'regular' | 'one-time' | 'extra';
  numberOfDogs: number;
  estimatedDuration: number;
  payment: number;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    latitude: number;
    longitude: number;
  };
  distance?: number;
}

export default function JobsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [jobs, setJobs] = useState<AvailableJob[]>([]);
  const [loading, setLoading] = useState(true);
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

    // Get user's location for distance calculation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }

    if (status === 'authenticated' && session?.user?.role === 'EMPLOYEE') {
      fetchAvailableJobs();
    }
  }, [status, session, router]);

  const fetchAvailableJobs = async () => {
    try {
      // In a real app, fetch from API
      // For demo purposes, using mock data
      const mockJobs: AvailableJob[] = [
        {
          id: '1',
          scheduledFor: new Date(Date.now() + 86400000).toISOString(), // tomorrow
          type: 'regular',
          numberOfDogs: 2,
          estimatedDuration: 45,
          payment: 35.50,
          address: {
            street: '123 Pine St',
            city: 'Seattle',
            state: 'WA',
            zipCode: '98101',
            latitude: 47.6062,
            longitude: -122.3321,
          }
        },
        {
          id: '2',
          scheduledFor: new Date(Date.now() + 172800000).toISOString(), // day after tomorrow
          type: 'one-time',
          numberOfDogs: 1,
          estimatedDuration: 30,
          payment: 25.00,
          address: {
            street: '456 Oak Ave',
            city: 'Seattle',
            state: 'WA',
            zipCode: '98102',
            latitude: 47.6102,
            longitude: -122.3426,
          }
        },
        {
          id: '3',
          scheduledFor: new Date(Date.now() + 259200000).toISOString(), // 3 days from now
          type: 'extra',
          numberOfDogs: 3,
          estimatedDuration: 60,
          payment: 45.75,
          address: {
            street: '789 Maple Rd',
            city: 'Bellevue',
            state: 'WA',
            zipCode: '98004',
            latitude: 47.6101,
            longitude: -122.2015,
          }
        }
      ];
      
      setJobs(mockJobs);
    } catch (err) {
      setError('Failed to load available jobs');
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to claim this job?')) {
      return;
    }

    try {
      // In a real app, make API call to claim job
      // For demo, just remove the job from the list
      setJobs(jobs.filter(job => job.id !== jobId));
      
      // Show success message
      toast.success('Job claimed successfully!');
    } catch (err) {
      toast.error('Failed to claim job. Please try again.');
      console.error('Error claiming job:', err);
    }
  };

  const calculateDistance = (job: AvailableJob) => {
    if (!userLocation) return null;

    const R = 6371; // Earth's radius in km
    const lat1 = userLocation.latitude * (Math.PI / 180);
    const lat2 = job.address.latitude * (Math.PI / 180);
    const deltaLat = (job.address.latitude - userLocation.latitude) * (Math.PI / 180);
    const deltaLon = (job.address.longitude - userLocation.longitude) * (Math.PI / 180);

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(deltaLon / 2) *
        Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 0.621371 * 10) / 10; // Convert to miles and round to 1 decimal
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-[400px] transition-opacity duration-300">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Available Jobs</h1>
          <p className="text-gray-500">
            {jobs.length} jobs available in your service area
          </p>
        </div>
        <Button onClick={() => fetchAvailableJobs()}>Refresh</Button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.map((job) => (
          <Card key={job.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{format(new Date(job.scheduledFor), 'EEEE, MMM d')}</CardTitle>
                  <CardDescription>
                    {format(new Date(job.scheduledFor), 'h:mm a')}
                  </CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className={
                    job.type === 'regular'
                      ? 'bg-blue-100 text-blue-800'
                      : job.type === 'extra'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-green-100 text-green-800'
                  }
                >
                  {job.type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center text-gray-600">
                  <MapPinIcon className="w-5 h-5 mr-2" />
                  <div>
                    <div>{job.address.street}</div>
                    <div className="text-sm">
                      {job.address.city}, {job.address.state} {job.address.zipCode}
                    </div>
                    {userLocation && (
                      <div className="text-sm text-blue-600">
                        {calculateDistance(job)} miles away
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center text-gray-600">
                    <ClockIcon className="w-5 h-5 mr-2" />
                    <span>{job.estimatedDuration} mins</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <PawPrintIcon className="w-5 h-5 mr-2" />
                    <span>{job.numberOfDogs} dogs</span>
                  </div>
                </div>

                <div className="flex items-center text-green-600 font-semibold">
                  <DollarSignIcon className="w-5 h-5 mr-2" />
                  <span>${job.payment.toFixed(2)}</span>
                </div>

                <Button
                  className="w-full"
                  onClick={() => handleClaimJob(job.id)}
                >
                  Claim Job
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {jobs.length === 0 && (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No jobs available at the moment.</p>
            <p className="text-gray-400 text-sm mt-2">Check back later for new opportunities.</p>
          </div>
        )}
      </div>
    </div>
  );
} 