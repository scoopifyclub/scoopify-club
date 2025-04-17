'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  const [jobs, setJobs] = useState<AvailableJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
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

    fetchAvailableJobs();
  }, []);

  const fetchAvailableJobs = async () => {
    try {
      const response = await fetch('/api/employee/jobs', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
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
    if (!confirm('Are you sure you want to claim this job?')) {
      return;
    }

    try {
      const response = await fetch(`/api/employee/jobs/${jobId}/claim`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to claim job');
      }

      toast.success('Job claimed successfully!');
      fetchAvailableJobs(); // Refresh the list
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Available Jobs</h1>
          <p className="text-gray-600 mt-2">
            {jobs.length} jobs available in your service areas
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