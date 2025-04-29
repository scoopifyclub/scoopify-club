'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Camera, User, Calendar, Clock } from 'lucide-react';

// Dynamically import Leaflet components with no SSR
const MapContainer = dynamic(
    () => import('react-leaflet').then((mod) => mod.MapContainer),
    { ssr: false }
);

const TileLayer = dynamic(
    () => import('react-leaflet').then((mod) => mod.TileLayer),
    { ssr: false }
);

const Marker = dynamic(
    () => import('react-leaflet').then((mod) => mod.Marker),
    { ssr: false }
);

const Popup = dynamic(
    () => import('react-leaflet').then((mod) => mod.Popup),
    { ssr: false }
);

// Fix for default marker icons in Next.js
let icon;
if (typeof window !== 'undefined') {
    const L = require('leaflet');
    require('leaflet/dist/leaflet.css');
    icon = L.icon({
        iconUrl: '/images/marker-icon.png',
        iconRetinaUrl: '/images/marker-icon-2x.png',
        shadowUrl: '/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });
}

/**
 * @typedef {Object} PhotoMapProps
 * @property {Array<Object>} services - Array of service objects with location and photo data
 */

/**
 * Map component that displays service locations with photos
 * @param {PhotoMapProps} props - Component props
 * @returns {JSX.Element} The PhotoMap component
 */
export function PhotoMap({ services }) {
    const [isClient, setIsClient] = useState(false);
    const [center, setCenter] = useState([0, 0]);
    const [zoom, setZoom] = useState(2);

    useEffect(() => {
        setIsClient(true);
        if (services.length > 0) {
            // Calculate center based on all service locations
            const latitudes = services.map(s => s.location.latitude);
            const longitudes = services.map(s => s.location.longitude);
            const avgLat = latitudes.reduce((a, b) => a + b, 0) / latitudes.length;
            const avgLng = longitudes.reduce((a, b) => a + b, 0) / longitudes.length;
            setCenter([avgLat, avgLng]);
            setZoom(10);
        }
    }, [services]);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    if (!isClient) {
        return (
            <div className="h-[600px] w-full rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"/>
            </div>
        );
    }

    return (
        <div className="h-[600px] w-full rounded-lg overflow-hidden">
            <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
                <TileLayer 
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                {services.map((service) => (
                    <Marker 
                        key={service.serviceId} 
                        position={[service.location.latitude, service.location.longitude]} 
                        icon={icon}
                    >
                        <Popup>
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <User className="w-4 h-4"/>
                                    <span className="font-medium">{service.customer.email}</span>
                                </div>
                                
                                {service.customer.address && (
                                    <div className="text-sm">
                                        {service.customer.address.street}<br />
                                        {service.customer.address.city}, {service.customer.address.state} {service.customer.address.zipCode}
                                    </div>
                                )}

                                {service.employee && (
                                    <div className="flex items-center space-x-2 text-sm">
                                        <User className="w-4 h-4"/>
                                        <span>Employee: {service.employee.name}</span>
                                    </div>
                                )}

                                <div className="flex items-center space-x-2 text-sm">
                                    <Calendar className="w-4 h-4"/>
                                    <span>Scheduled: {formatDate(service.scheduledDate)}</span>
                                </div>

                                {service.completedAt && (
                                    <div className="flex items-center space-x-2 text-sm">
                                        <Clock className="w-4 h-4"/>
                                        <span>Completed: {formatDate(service.completedAt)}</span>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-2">
                                    {service.beforePhoto && (
                                        <div className="space-y-1">
                                            <div className="flex items-center space-x-1 text-sm">
                                                <Camera className="w-4 h-4"/>
                                                <span>Before</span>
                                            </div>
                                            <img 
                                                src={service.beforePhoto.url} 
                                                alt="Before" 
                                                className="w-full h-24 object-cover rounded"
                                            />
                                            <div className="text-xs text-gray-500">
                                                {formatDate(service.beforePhoto.timestamp)}
                                            </div>
                                        </div>
                                    )}

                                    {service.afterPhoto && (
                                        <div className="space-y-1">
                                            <div className="flex items-center space-x-1 text-sm">
                                                <Camera className="w-4 h-4"/>
                                                <span>After</span>
                                            </div>
                                            <img 
                                                src={service.afterPhoto.url} 
                                                alt="After" 
                                                className="w-full h-24 object-cover rounded"
                                            />
                                            <div className="text-xs text-gray-500">
                                                {formatDate(service.afterPhoto.timestamp)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
