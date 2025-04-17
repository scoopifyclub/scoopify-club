'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';

interface MapProps {
  center: LatLngExpression;
  zoom?: number;
  markers?: Array<{
    position: LatLngExpression;
    title: string;
    description?: string;
  }>;
}

function MapContent({ center, markers }: MapProps) {
  const map = useMap();

  useEffect(() => {
    map.setView(center);
  }, [center, map]);

  return null;
}

export default function Map({ center, zoom = 13, markers = [] }: MapProps) {
  return (
    <div className="h-[400px] w-full">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapContent center={center} markers={markers} />
        {markers.map((marker, index) => (
          <Marker key={index} position={marker.position}>
            <Popup>
              <div>
                <h3 className="font-semibold">{marker.title}</h3>
                {marker.description && (
                  <p className="text-sm text-gray-600">{marker.description}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
} 