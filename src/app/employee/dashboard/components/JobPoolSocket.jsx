'use client';

import { useEffect, useRef } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';



export function JobPoolSocket({ employeeId, handleJobUpdate = (jobs) => {}, handleJobClaim = (job) => {} }) {
  const socketRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    const socket = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/job-pool`);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('Connected to job pool WebSocket');
      socket.send(JSON.stringify({
        type: 'join-job-pool',
        employeeId: user.id
      }));
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'job-pool-update':
            handleJobUpdate(data.jobs);
            break;
          case 'job-claimed':
            onJobClaim(data.job);
            break;
          case 'error':
            toast.error(data.message);
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        toast.error('Failed to process job pool update');
      }
    };

    socket.onclose = () => {
      console.log('Disconnected from job pool WebSocket');
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        socketRef.current?.close();
        socketRef.current = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/job-pool`);
      }, 5000);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast.error('WebSocket connection error');
    };

    return () => {
      socket.close();
    };
  }, [user?.id, onJobUpdate, onJobClaim]);

  return null;
}
