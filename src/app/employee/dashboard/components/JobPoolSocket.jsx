'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function JobPoolSocket({ employeeId, handleJobUpdate = (jobs) => {}, handleJobClaim = (job) => {} }) {
  const intervalRef = useRef(null);
  const { user } = useAuth();
  const [isPolling, setIsPolling] = useState(false);

  const fetchJobs = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch('/api/employee/jobs/pool', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.jobs) {
          handleJobUpdate(data.jobs);
        }
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      // Don't show toast for every error to avoid spam
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    // Initial fetch
    fetchJobs();
    setIsPolling(true);

    // Set up polling interval (every 10 seconds)
    intervalRef.current = setInterval(fetchJobs, 10000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        setIsPolling(false);
      }
    };
  }, [user?.id, handleJobUpdate]);

  return null;
}
