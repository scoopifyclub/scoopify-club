'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Navigation, Zap, Calendar, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function InteractiveMap({ employeeId }) {
  const [mapData, setMapData] = useState(null);
  const [mapType, setMapType] = useState('service-areas');
  const [loading, setLoading] = useState(true);
  const [googleMap, setGoogleMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const mapRef = useRef(null);

  useEffect(() => {
    loadGoogleMapsAPI();
  }, []);

  useEffect(() => {
    if (googleMap) {
      fetchMapData();
    }
  }, [mapType, googleMap]);

  const loadGoogleMapsAPI = () => {
    if (window.google && window.google.maps) {
      initializeMap();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'demo-key'}&libraries=geometry`;
    script.async = true;
    script.defer = true;
    script.onload = initializeMap;
    document.head.appendChild(script);
  };

  const initializeMap = () => {
    if (!mapRef.current) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 39.7392, lng: -104.9903 }, // Denver
      zoom: 10,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    setGoogleMap(map);
  };

  const fetchMapData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/employee/maps?type=${mapType}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch map data');
      }

      const data = await response.json();
      setMapData(data);
      renderMapData(data);
    } catch (error) {
      console.error('Error fetching map data:', error);
      toast.error('Failed to load map data');
    } finally {
      setLoading(false);
    }
  };

  const renderMapData = (data) => {
    if (!googleMap || !data) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    const newMarkers = [];

    switch (data.type) {
      case 'service-areas':
        renderServiceAreas(data.data, newMarkers);
        break;
      case 'route':
        renderRoute(data.data, newMarkers);
        break;
      case 'jobs':
        renderJobs(data.data, newMarkers);
        break;
    }

    setMarkers(newMarkers);

    // Center and zoom map
    if (data.data.center) {
      googleMap.setCenter(data.data.center);
      googleMap.setZoom(data.data.zoom || 10);
    }
  };

  const renderServiceAreas = (data, markers) => {
    data.serviceAreas.forEach(area => {
      const marker = new window.google.maps.Marker({
        position: area.coordinates,
        map: googleMap,
        title: `Service Area: ${area.zipCode}`,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="#3B82F6" opacity="0.8"/>
              <circle cx="12" cy="12" r="6" fill="#3B82F6"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(24, 24)
        }
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold;">Service Area</h3>
            <p style="margin: 4px 0;"><strong>ZIP Code:</strong> ${area.zipCode}</p>
            <p style="margin: 4px 0;"><strong>Travel Distance:</strong> ${area.travelDistance} miles</p>
            <p style="margin: 4px 0;"><strong>Status:</strong> ${area.active ? 'Active' : 'Inactive'}</p>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(googleMap, marker);
      });

      markers.push(marker);
    });
  };

  const renderRoute = (data, markers) => {
    const waypoints = data.waypoints;
    const path = new window.google.maps.Polyline({
      path: waypoints.map(wp => wp.coordinates),
      geodesic: true,
      strokeColor: '#3B82F6',
      strokeOpacity: 1.0,
      strokeWeight: 3,
      map: googleMap
    });

    waypoints.forEach((waypoint, index) => {
      const marker = new window.google.maps.Marker({
        position: waypoint.coordinates,
        map: googleMap,
        title: `${index + 1}. ${waypoint.customerName}`,
        label: {
          text: (index + 1).toString(),
          color: 'white',
          fontWeight: 'bold'
        },
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="14" fill="#10B981"/>
              <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">${index + 1}</text>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(32, 32)
        }
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 250px;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold;">Stop ${index + 1}</h3>
            <p style="margin: 4px 0;"><strong>Customer:</strong> ${waypoint.customerName}</p>
            <p style="margin: 4px 0;"><strong>Time:</strong> ${new Date(waypoint.scheduledTime).toLocaleTimeString()}</p>
            <p style="margin: 4px 0;"><strong>Duration:</strong> ${waypoint.estimatedDuration} min</p>
            ${waypoint.address ? `<p style="margin: 4px 0;"><strong>Address:</strong> ${waypoint.address.street}, ${waypoint.address.city}</p>` : ''}
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(googleMap, marker);
      });

      markers.push(marker);
    });
  };

  const renderJobs = (data, markers) => {
    data.jobs.forEach(job => {
      const marker = new window.google.maps.Marker({
        position: job.coordinates,
        map: googleMap,
        title: `Job: ${job.customerName}`,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="#F59E0B"/>
              <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="white"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(24, 24)
        }
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 250px;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold;">Available Job</h3>
            <p style="margin: 4px 0;"><strong>Customer:</strong> ${job.customerName}</p>
            <p style="margin: 4px 0;"><strong>Earnings:</strong> $${job.potentialEarnings.toFixed(2)}</p>
            <p style="margin: 4px 0;"><strong>Date:</strong> ${new Date(job.scheduledDate).toLocaleDateString()}</p>
            ${job.address ? `<p style="margin: 4px 0;"><strong>Address:</strong> ${job.address.street}, ${job.address.city}</p>` : ''}
            <button onclick="claimJob('${job.id}')" style="margin-top: 8px; padding: 4px 8px; background: #3B82F6; color: white; border: none; border-radius: 4px; cursor: pointer;">Claim Job</button>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(googleMap, marker);
      });

      markers.push(marker);
    });
  };

  const claimJob = async (jobId) => {
    try {
      const response = await fetch(`/api/employee/jobs/${jobId}/claim`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to claim job');
      }

      toast.success('Job claimed successfully!');
      fetchMapData(); // Refresh map data
    } catch (error) {
      console.error('Error claiming job:', error);
      toast.error('Failed to claim job');
    }
  };

  // Add claimJob to window for info window buttons
  useEffect(() => {
    window.claimJob = claimJob;
    return () => {
      delete window.claimJob;
    };
  }, []);

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Interactive Service Map
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-4">
          <Select value={mapType} onValueChange={setMapType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select map view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="service-areas">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Service Areas
                </div>
              </SelectItem>
              <SelectItem value="route">
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4" />
                  Today's Route
                </div>
              </SelectItem>
              <SelectItem value="jobs">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Available Jobs
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {mapData?.data?.statistics && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{mapData.data.statistics.totalStops} stops</span>
              </div>
              <div className="flex items-center gap-1">
                <Navigation className="h-4 w-4" />
                <span>{mapData.data.statistics.totalDistance}</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-4 w-4" />
                <span>{mapData.data.statistics.totalDuration}</span>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                <span>{mapData.data.statistics.totalEarnings}</span>
              </div>
            </div>
          )}
        </div>

        <div 
          ref={mapRef} 
          className="w-full h-96 rounded-lg border"
          style={{ minHeight: '400px' }}
        >
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Loading map...</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <p><strong>Service Areas:</strong> Blue circles show your active service areas</p>
          <p><strong>Route:</strong> Green numbered markers show today's service stops</p>
          <p><strong>Available Jobs:</strong> Yellow stars show jobs you can claim</p>
        </div>
      </CardContent>
    </Card>
  );
} 