'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, User, Key, AlertCircle, AlertTriangle, XCircle, Camera, CheckCircle } from 'lucide-react';
import { ServiceChecklist } from '@/components/ServiceChecklist';
import { ServicePhotoUpload } from '@/components/ServicePhotoUpload';
import { toast } from 'sonner';

interface Service {
  id: string;
  customerName: string;
  address: string;
  gateCode?: string;
  specialInstructions?: string;
  scheduledDate: string;
  arrivalDeadline?: string;
  status: 'CLAIMED' | 'IN_PROGRESS' | 'COMPLETED';
  paymentAmount: number;
  photos: {
    type: string;
    url: string;
  }[];
  checklist?: {
    cornersCleaned: boolean;
    wasteDisposed: boolean;
    areaRaked: boolean;
    gateClosed: boolean;
    notes?: string;
  };
}

export default function ServicePage({ params }: { params: { serviceId: string } }) {
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [arrived, setArrived] = useState(false);
  const [checklistComplete, setChecklistComplete] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchService();
  }, [params.serviceId]);

  const fetchService = async () => {
    try {
      const response = await fetch(`/api/services/${params.serviceId}`);
      if (!response.ok) throw new Error('Failed to fetch service');
      const data = await response.json();
      setService(data);
      setArrived(data.status === 'IN_PROGRESS');
      setChecklistComplete(data.checklist?.cornersCleaned && 
                          data.checklist?.wasteDisposed && 
                          data.checklist?.areaRaked && 
                          data.checklist?.gateClosed);
    } catch (error) {
      console.error('Error fetching service:', error);
      toast.error('Failed to load service details');
    } finally {
      setLoading(false);
    }
  };

  const handleArrival = async () => {
    try {
      const response = await fetch(`/api/services/${params.serviceId}/arrive`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to confirm arrival');
      setArrived(true);
      setService(prev => prev ? { ...prev, status: 'IN_PROGRESS' } : null);
      toast.success('Arrival confirmed');
    } catch (error) {
      console.error('Error confirming arrival:', error);
      toast.error('Failed to confirm arrival');
    }
  };

  const handleComplete = async () => {
    try {
      const response = await fetch(`/api/services/${params.serviceId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          checklist: service?.checklist,
          photos: service?.photos,
        }),
      });
      if (!response.ok) throw new Error('Failed to complete service');
      toast.success('Service completed successfully');
      router.push('/employee/dashboard');
    } catch (error) {
      console.error('Error completing service:', error);
      toast.error('Failed to complete service');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!service) {
    return <div className="flex justify-center items-center min-h-screen">Service not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-4">Service Details</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              <span>{service.address}</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              <span>{new Date(service.scheduledDate).toLocaleString()}</span>
            </div>
            {service.gateCode && (
              <div className="flex items-center">
                <Key className="w-5 h-5 mr-2" />
                <span>Gate Code: {service.gateCode}</span>
              </div>
            )}
            <div className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              <span>{service.customerName}</span>
            </div>
          </div>
          {service.specialInstructions && (
            <div className="mt-4 p-4 bg-yellow-50 rounded">
              <AlertCircle className="w-5 h-5 text-yellow-500 inline-block mr-2" />
              <span className="text-yellow-700">{service.specialInstructions}</span>
            </div>
          )}
        </div>

        {!arrived && (
          <div className="mb-6">
            <Button onClick={handleArrival} className="w-full">
              <CheckCircle className="w-5 h-5 mr-2" />
              Confirm Arrival
            </Button>
          </div>
        )}

        {arrived && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Before Photos</h2>
              <ServicePhotoUpload
                serviceId={params.serviceId}
                type="BEFORE"
                onUploadComplete={() => toast.success('Before photos uploaded')}
              />
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Service Checklist</h2>
              <ServiceChecklist
                serviceId={params.serviceId}
                initialChecklist={service.checklist}
                onComplete={setChecklistComplete}
              />
            </div>

            {checklistComplete && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">After Photos</h2>
                <ServicePhotoUpload
                  serviceId={params.serviceId}
                  type="AFTER"
                  onUploadComplete={() => toast.success('After photos uploaded')}
                />
              </div>
            )}

            <div className="mt-6">
              <Button
                onClick={handleComplete}
                disabled={!checklistComplete}
                className="w-full"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Complete Service
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 