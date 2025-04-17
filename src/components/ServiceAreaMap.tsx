'use client';

import { useState, useEffect } from 'react';
import Map from './Map';
import { LatLngExpression } from 'leaflet';

interface Customer {
  id: string;
  name: string;
  address: string;
  coordinates: [number, number];
  serviceDay: string;
}

interface ServiceAreaMapProps {
  areaId: string;
}

export default function ServiceAreaMap({ areaId }: ServiceAreaMapProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [center, setCenter] = useState<LatLngExpression>([37.7749, -122.4194]); // Default to SF

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch(`/api/service-areas/${areaId}/customers`);
        if (!response.ok) {
          throw new Error('Failed to fetch customers');
        }
        const data = await response.json();
        setCustomers(data.customers);
        
        // Set center to first customer's location or default
        if (data.customers.length > 0) {
          setCenter(data.customers[0].coordinates);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load customers');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [areaId]);

  if (loading) {
    return <div className="flex items-center justify-center h-[400px]">Loading service area...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-[400px] text-red-500">{error}</div>;
  }

  const markers = customers.map(customer => ({
    position: customer.coordinates,
    title: customer.name,
    description: `${customer.address} - Service Day: ${customer.serviceDay}`
  }));

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold mb-4">Service Area Customers</h2>
      <Map 
        center={center}
        zoom={12}
        markers={markers}
      />
      <div className="mt-4">
        <p className="text-sm text-gray-600">
          Total customers in area: {customers.length}
        </p>
      </div>
    </div>
  );
} 