'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, DollarSign } from 'lucide-react';
import { JobPoolEntry } from '@/types/job-pool';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { JobStatus } from '@/types/enums';

interface JobPoolProps {
  employeeId: string;
}

export function JobPool({ employeeId }: JobPoolProps) {
  const [jobs, setJobs] = useState<JobPoolEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    // Fetch initial job pool
    const fetchJobs = async () => {
      try {
        const response = await fetch('/api/jobs/pool', {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error('Failed to fetch job pool');
        }
        const data = await response.json();
        setJobs(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching job pool:', error);
        toast.error('Failed to load job pool');
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const handleClaimJob = async (job: JobPoolEntry) => {
    try {
      const response = await fetch('/api/jobs/pool', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ serviceId: job.serviceId })
      });

      if (!response.ok) {
        throw new Error('Failed to claim job');
      }

      const updatedJob = await response.json();
      setJobs(prev => prev.map(j => j.id === updatedJob.id ? updatedJob : j));
      toast.success('Job claimed successfully');
    } catch (error) {
      console.error('Error claiming job:', error);
      toast.error('Failed to claim job');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-32" />
              <div className="h-4 bg-gray-200 rounded w-24" />
              <div className="h-4 bg-gray-200 rounded w-20" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-12">
          <MapPin className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs available</h3>
          <p className="mt-1 text-sm text-gray-500">
            Check back later for new job opportunities
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <Card key={job.id} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{job.service.customer.name}</h3>
              <p className="text-sm text-gray-500">
                <MapPin className="inline-block w-4 h-4 mr-1" />
                {job.service.address}
              </p>
              <p className="text-sm text-gray-500">
                <Calendar className="inline-block w-4 h-4 mr-1" />
                {new Date(job.service.scheduledAt).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-500">
                <Clock className="inline-block w-4 h-4 mr-1" />
                {job.service.serviceWindow}
              </p>
            </div>
            <Button
              onClick={() => handleClaimJob(job)}
              disabled={job.status !== JobStatus.AVAILABLE}
            >
              {job.status === JobStatus.AVAILABLE ? 'Claim Job' : 'Claimed'}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
