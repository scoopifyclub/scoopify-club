// Mobile Job Manager Component
// For employee mobile app features - job assignment, GPS tracking, photo upload, time tracking
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Camera, Clock, CheckCircle, XCircle, Navigation, Upload, Play, Pause, Stop } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner, LoadingOverlay } from '@/components/ui/loading-states';
import { cn } from '@/lib/utils';

const MobileJobManager = ({
  employeeId,
  onJobUpdate,
  onTimeUpdate,
  onPhotoUpload,
  className,
  ...props
}) => {
  const [jobs, setJobs] = useState([]);
  const [activeJob, setActiveJob] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [trackingStartTime, setTrackingStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const locationWatchId = useRef(null);
  const timeInterval = useRef(null);
  const fileInputRef = useRef(null);

  // Mock data for demonstration
  const mockJobs = [
    {
      id: '1',
      customerName: 'John Smith',
      address: '123 Main St, Peyton, CO 80831',
      scheduledTime: '2024-01-15T10:00:00Z',
      status: 'assigned',
      serviceType: 'weekly',
      notes: 'Large yard, 2 dogs',
      estimatedDuration: 30,
      payment: 25.00,
      coordinates: { lat: 39.0333, lng: -104.4833 }
    },
    {
      id: '2',
      customerName: 'Sarah Johnson',
      address: '456 Oak Ave, Peyton, CO 80831',
      scheduledTime: '2024-01-15T11:00:00Z',
      status: 'in_progress',
      serviceType: 'weekly',
      notes: 'Small yard, 1 dog',
      estimatedDuration: 20,
      payment: 20.00,
      coordinates: { lat: 39.0333, lng: -104.4833 }
    }
  ];

  useEffect(() => {
    loadJobs();
    startLocationTracking();
    
    return () => {
      stopLocationTracking();
      if (timeInterval.current) {
        clearInterval(timeInterval.current);
      }
    };
  }, [employeeId]);

  useEffect(() => {
    if (isTracking) {
      timeInterval.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timeInterval.current) {
        clearInterval(timeInterval.current);
      }
    }
  }, [isTracking]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setJobs(mockJobs);
      setActiveJob(mockJobs.find(job => job.status === 'in_progress'));
    } catch (err) {
      setError('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const startLocationTracking = () => {
    if ('geolocation' in navigator) {
      locationWatchId.current = navigator.geolocation.watchPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          console.error('Location tracking error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        }
      );
    }
  };

  const stopLocationTracking = () => {
    if (locationWatchId.current) {
      navigator.geolocation.clearWatch(locationWatchId.current);
    }
  };

  const acceptJob = async (jobId) => {
    try {
      const updatedJobs = jobs.map(job => 
        job.id === jobId 
          ? { ...job, status: 'accepted' }
          : job
      );
      setJobs(updatedJobs);
      setActiveJob(updatedJobs.find(job => job.id === jobId));
      onJobUpdate?.(jobId, 'accepted');
    } catch (err) {
      setError('Failed to accept job');
    }
  };

  const startJob = async (jobId) => {
    try {
      setIsTracking(true);
      setTrackingStartTime(new Date());
      setElapsedTime(0);
      
      const updatedJobs = jobs.map(job => 
        job.id === jobId 
          ? { ...job, status: 'in_progress' }
          : job
      );
      setJobs(updatedJobs);
      setActiveJob(updatedJobs.find(job => job.id === jobId));
      onJobUpdate?.(jobId, 'in_progress');
    } catch (err) {
      setError('Failed to start job');
    }
  };

  const pauseJob = () => {
    setIsTracking(false);
  };

  const resumeJob = () => {
    setIsTracking(true);
  };

  const completeJob = async (jobId) => {
    try {
      setIsTracking(false);
      const totalTime = elapsedTime;
      
      const updatedJobs = jobs.map(job => 
        job.id === jobId 
          ? { ...job, status: 'completed', actualDuration: totalTime }
          : job
      );
      setJobs(updatedJobs);
      setActiveJob(null);
      
      onJobUpdate?.(jobId, 'completed');
      onTimeUpdate?.(jobId, totalTime);
    } catch (err) {
      setError('Failed to complete job');
    }
  };

  const handlePhotoUpload = async (files) => {
    try {
      setUploading(true);
      const newPhotos = Array.from(files).map((file, index) => ({
        id: Date.now() + index,
        file,
        preview: URL.createObjectURL(file),
        uploaded: false,
        category: 'after',
        description: ''
      }));
      
      setPhotos(prev => [...prev, ...newPhotos]);
      
      // Simulate upload
      for (let photo of newPhotos) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setPhotos(prev => prev.map(p => 
          p.id === photo.id ? { ...p, uploaded: true } : p
        ));
      }
      
      onPhotoUpload?.(activeJob?.id, newPhotos);
    } catch (err) {
      setError('Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      assigned: { variant: 'secondary', text: 'Assigned' },
      accepted: { variant: 'default', text: 'Accepted' },
      in_progress: { variant: 'default', text: 'In Progress' },
      completed: { variant: 'default', text: 'Completed' },
      cancelled: { variant: 'destructive', text: 'Cancelled' }
    };
    
    const config = statusConfig[status] || statusConfig.assigned;
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  if (loading) {
    return <LoadingSpinner message="Loading jobs..." />;
  }

  return (
    <div className={cn("space-y-6", className)} {...props}>
      <LoadingOverlay isLoading={uploading} message="Uploading photos...">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Job Manager</h2>
              <p className="text-gray-600">Manage your assigned jobs</p>
            </div>
            {currentLocation && (
              <Badge variant="outline" className="text-xs">
                <MapPin className="w-3 h-3 mr-1" />
                GPS Active
              </Badge>
            )}
          </div>

          {/* Active Job Card */}
          {activeJob && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Active Job
                  {getStatusBadge(activeJob.status)}
                </CardTitle>
                <CardDescription>
                  {activeJob.customerName} • {activeJob.address}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Time Tracking */}
                <div className="bg-white p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Time Tracking</span>
                    <span className="text-lg font-mono">{formatTime(elapsedTime)}</span>
                  </div>
                  <div className="flex space-x-2">
                    {!isTracking ? (
                      <Button onClick={resumeJob} size="sm">
                        <Play className="w-4 h-4 mr-1" />
                        Resume
                      </Button>
                    ) : (
                      <Button onClick={pauseJob} variant="outline" size="sm">
                        <Pause className="w-4 h-4 mr-1" />
                        Pause
                      </Button>
                    )}
                    <Button onClick={() => completeJob(activeJob.id)} size="sm">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Complete
                    </Button>
                  </div>
                </div>

                {/* Photo Upload */}
                <div className="bg-white p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Service Photos</span>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      size="sm"
                      variant="outline"
                    >
                      <Camera className="w-4 h-4 mr-1" />
                      Add Photos
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload(e.target.files)}
                    className="hidden"
                  />
                  {photos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {photos.map((photo) => (
                        <div key={photo.id} className="relative">
                          <img
                            src={photo.preview}
                            alt="Service photo"
                            className="w-full h-20 object-cover rounded"
                          />
                          {photo.uploaded && (
                            <CheckCircle className="absolute top-1 right-1 w-4 h-4 text-green-600 bg-white rounded-full" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Navigation */}
                <Button className="w-full" variant="outline">
                  <Navigation className="w-4 h-4 mr-2" />
                  Navigate to Location
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Job List */}
          <Tabs defaultValue="assigned" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="assigned">Assigned</TabsTrigger>
              <TabsTrigger value="accepted">Accepted</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>

            <TabsContent value="assigned" className="space-y-4">
              {jobs.filter(job => job.status === 'assigned').map((job) => (
                <Card key={job.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{job.customerName}</h3>
                      {getStatusBadge(job.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{job.address}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                      <span>{new Date(job.scheduledTime).toLocaleTimeString()}</span>
                      <span>${job.payment}</span>
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={() => acceptJob(job.id)} size="sm">
                        Accept Job
                      </Button>
                      <Button onClick={() => startJob(job.id)} size="sm" variant="outline">
                        Start Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="accepted" className="space-y-4">
              {jobs.filter(job => job.status === 'accepted').map((job) => (
                <Card key={job.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{job.customerName}</h3>
                      {getStatusBadge(job.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{job.address}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                      <span>{new Date(job.scheduledTime).toLocaleTimeString()}</span>
                      <span>${job.payment}</span>
                    </div>
                    <Button onClick={() => startJob(job.id)} className="w-full">
                      Start Job
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {jobs.filter(job => job.status === 'completed').map((job) => (
                <Card key={job.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{job.customerName}</h3>
                      {getStatusBadge(job.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{job.address}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Duration: {job.actualDuration ? formatTime(job.actualDuration) : 'N/A'}</span>
                      <span>${job.payment}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </LoadingOverlay>
    </div>
  );
};

export default MobileJobManager; 