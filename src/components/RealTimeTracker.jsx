'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { MapPin, Clock, User, Phone, MessageCircle, Navigation } from 'lucide-react';
import { toast } from 'sonner';

export default function RealTimeTracker({ serviceId, customerView = false }) {
  const [trackingData, setTrackingData] = useState({
    status: 'loading',
    employee: null,
    location: null,
    eta: null,
    progress: 0,
    lastUpdate: null,
    serviceDetails: null
  });

  const [isLive, setIsLive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!serviceId) return;

    const fetchTrackingData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/services/${serviceId}/tracking`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch tracking data');
        }

        const data = await response.json();
        setTrackingData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching tracking data:', err);
        setError('Failed to load tracking information');
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchTrackingData();

    // Set up real-time updates
    const interval = setInterval(fetchTrackingData, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [serviceId]);

  // Show loading state
  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2">Loading tracking data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show no data state
  if (!trackingData.employee || !trackingData.serviceDetails) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="text-center text-gray-600">
            <p>No tracking information available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'en_route': return 'bg-blue-100 text-blue-800';
      case 'on_site': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'en_route': return 'En Route';
      case 'on_site': return 'On Site';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      default: return 'Unknown';
    }
  };

  const handleContact = () => {
    toast.success('Opening phone app...');
    window.open(`tel:${trackingData.employee.phone}`);
  };

  const handleMessage = () => {
    toast.success('Opening messaging...');
    // In a real app, this would open a chat interface
  };

  const handleDirections = () => {
    toast.success('Opening directions...');
    const url = `https://www.google.com/maps/dir/?api=1&destination=${trackingData.location.lat},${trackingData.location.lng}`;
    window.open(url, '_blank');
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Live Service Tracking</CardTitle>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-sm text-gray-600">{isLive ? 'LIVE' : 'COMPLETED'}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status and Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge className={getStatusColor(trackingData.status)}>
              {getStatusText(trackingData.status)}
            </Badge>
            <span className="text-sm text-gray-600">
              ETA: {trackingData.eta}
            </span>
          </div>
          <Progress value={trackingData.progress} className="h-2" />
          <p className="text-xs text-gray-500 text-center">
            {trackingData.progress}% complete
          </p>
        </div>

        {/* Employee Info */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-medium">{trackingData.employee.name}</p>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>⭐ {trackingData.employee.rating}</span>
              <span>•</span>
              <span>Professional Scooper</span>
            </div>
          </div>
        </div>

        {/* Service Details */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Scheduled Time:</span>
            <span className="font-medium">{trackingData.serviceDetails.scheduledTime}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Duration:</span>
            <span className="font-medium">{trackingData.serviceDetails.estimatedDuration}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Service Type:</span>
            <span className="font-medium">{trackingData.serviceDetails.serviceType}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleContact}
            className="flex-1"
          >
            <Phone className="w-4 h-4 mr-2" />
            Call
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleMessage}
            className="flex-1"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Message
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDirections}
            className="flex-1"
          >
            <Navigation className="w-4 h-4 mr-2" />
            Directions
          </Button>
        </div>

        {/* Last Update */}
        <div className="text-xs text-gray-500 text-center pt-2 border-t">
          Last updated: {trackingData.lastUpdate.toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
} 