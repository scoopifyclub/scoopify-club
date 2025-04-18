'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin } from 'lucide-react';

// Fix for default marker icons in Next.js
const icon = L.icon({
  iconUrl: '/images/marker-icon.png',
  iconRetinaUrl: '/images/marker-icon-2x.png',
  shadowUrl: '/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface Service {
  id: string;
  status: string;
  scheduledDate: string;
  customer: {
    email: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    } | null;
  };
  servicePlan: {
    name: string;
    duration: number;
  } | null;
  notes: string | null;
  latitude?: number;
  longitude?: number;
}

interface ServiceMapProps {
  services: Service[];
  onServiceClick?: (service: Service) => void;
}

export function ServiceMap({ services, onServiceClick }: ServiceMapProps) {
  const [center, setCenter] = useState<[number, number]>([0, 0]);
  const [zoom, setZoom] = useState(2);

  useEffect(() => {
    if (services.length > 0) {
      // Calculate center based on all service locations
      const validLocations = services.filter(s => s.latitude && s.longitude);
      if (validLocations.length > 0) {
        const latitudes = validLocations.map(s => s.latitude!);
        const longitudes = validLocations.map(s => s.longitude!);
        
        const avgLat = latitudes.reduce((a, b) => a + b, 0) / latitudes.length;
        const avgLng = longitudes.reduce((a, b) => a + b, 0) / longitudes.length;
        
        setCenter([avgLat, avgLng]);
        setZoom(12);
      }
    }
  }, [services]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="h-[500px] w-full rounded-lg overflow-hidden">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {services.map((service) => {
          if (!service.latitude || !service.longitude) return null;
          
          return (
            <Marker
              key={service.id}
              position={[service.latitude, service.longitude]}
              icon={icon}
              eventHandlers={{
                click: () => onServiceClick?.(service)
              }}
            >
              <Popup>
                <div className="space-y-2">
                  <div className="font-medium">
                    {service.servicePlan?.name || 'Service'}
                  </div>
                  <div className="text-sm">
                    {formatTime(service.scheduledDate)}
                  </div>
                  <div className="text-sm">
                    {service.customer.email}
                  </div>
                  {service.customer.address && (
                    <div className="text-sm">
                      {service.customer.address.street}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
} 