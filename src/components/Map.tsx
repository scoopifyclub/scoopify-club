'use client';

import { useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface Service {
  id: string;
  customerName: string;
  address: string;
  latitude?: number;
  longitude?: number;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
}

interface MapProps {
  services: Service[];
}

export default function Map({ services }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initMap = async () => {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        version: 'weekly',
      });

      const { Map } = await loader.importLibrary('maps');
      const { Marker } = await loader.importLibrary('marker');
      const { InfoWindow } = await loader.importLibrary('maps');

      // Initialize the map
      const map = new Map(mapRef.current!, {
        center: { lat: 37.7749, lng: -122.4194 }, // Default to San Francisco
        zoom: 12,
      });

      // Create markers for each service
      services.forEach((service) => {
        if (service.latitude && service.longitude) {
          const marker = new Marker({
            position: { lat: service.latitude, lng: service.longitude },
            map,
            title: service.customerName,
            icon: {
              url: getMarkerIcon(service.status),
              scaledSize: new google.maps.Size(32, 32),
            },
          });

          const infoWindow = new InfoWindow({
            content: `
              <div class="p-2">
                <h3 class="font-semibold">${service.customerName}</h3>
                <p class="text-sm">${service.address}</p>
                <p class="text-sm">Status: ${service.status}</p>
              </div>
            `,
          });

          marker.addListener('click', () => {
            infoWindow.open(map, marker);
          });
        }
      });

      // Fit map to show all markers
      if (services.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        services.forEach((service) => {
          if (service.latitude && service.longitude) {
            bounds.extend({ lat: service.latitude, lng: service.longitude });
          }
        });
        map.fitBounds(bounds);
      }
    };

    initMap();
  }, [services]);

  const getMarkerIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'https://maps.google.com/mapfiles/ms/icons/green-dot.png';
      case 'CANCELLED':
        return 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';
      default:
        return 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png';
    }
  };

  return <div ref={mapRef} className="h-full w-full rounded-lg" />;
} 