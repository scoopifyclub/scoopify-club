'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, User, Key, AlertCircle, CheckCircle } from 'lucide-react';
import { ServiceChecklist } from '@/components/ServiceChecklist';
import { ServicePhotoUpload } from '@/components/ServicePhotoUpload';
import { toast } from 'sonner';
import {
  getJob,
  listJobPhotos,
  checkInToJob,
  completeJob,
  completionErrorMessage,
  JobApiError,
} from '@/lib/job-api-client';

function formatAddress(service) {
  const address = service?.customer?.address || service?.location?.address;
  if (!address) return service?.address || 'Address available after claim';
  if (typeof address === 'string') return address;
  return [address.street, address.city, address.state, address.zipCode].filter(Boolean).join(', ');
}

export default function ServicePage() {
  const params = useParams();
  const serviceId = params.id;
  const [service, setService] = useState(null);
  const [photos, setPhotos] = useState({ before: [], after: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [arrived, setArrived] = useState(false);
  const [checklistComplete, setChecklistComplete] = useState(false);
  const router = useRouter();

  const refreshPhotos = useCallback(async () => {
    if (!serviceId) return;
    try {
      const data = await listJobPhotos(serviceId);
      setPhotos({
        before: data.byType?.before || [],
        after: data.byType?.after || [],
      });
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  }, [serviceId]);

  const fetchService = useCallback(async () => {
    if (!serviceId) return;
    try {
      const data = await getJob(serviceId);
      setService(data);
      setArrived(data.status === 'IN_PROGRESS' || Boolean(data.arrivedAt));
      const items = data.checklist?.items || {};
      setChecklistComplete(Boolean(items.allWasteRemoved || items.wasteDisposed || items.yardCleaned)
        && Boolean(items.gateClosed || items.gateClosedOnExit));
      await refreshPhotos();
    } catch (error) {
      console.error('Error fetching service:', error);
      toast.error(error instanceof JobApiError ? error.message : 'Failed to load service details');
      setService(null);
    } finally {
      setLoading(false);
    }
  }, [serviceId, refreshPhotos]);

  useEffect(() => {
    fetchService();
  }, [fetchService]);

  const handleArrival = async () => {
    setBusy(true);
    try {
      const updated = await checkInToJob(serviceId);
      setArrived(true);
      setService((prev) => (prev ? { ...prev, ...updated, status: 'IN_PROGRESS' } : updated));
      toast.success('Arrival confirmed');
    } catch (error) {
      console.error('Error confirming arrival:', error);
      toast.error(error instanceof JobApiError ? error.message : 'Failed to confirm arrival');
    } finally {
      setBusy(false);
    }
  };

  const handleComplete = async () => {
    setBusy(true);
    try {
      await completeJob(serviceId, {
        checklist: service?.checklist?.items || service?.checklist,
        notes: service?.checklist?.notes,
      });
      toast.success('Service completed successfully');
      router.push('/employee/dashboard');
    } catch (error) {
      console.error('Error completing service:', error);
      toast.error(completionErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }
  if (!service) {
    return <div className="flex justify-center items-center min-h-screen">Service not found</div>;
  }

  const afterCount = photos.after.length;
  const photosReady = afterCount >= 1;
  const canComplete = checklistComplete && photosReady && !busy;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-4">Service Details</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              <span>{formatAddress(service)}</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              <span>{new Date(service.scheduledDate).toLocaleString()}</span>
            </div>
            {(service.gateCode || service.customer?.gateCode) && (
              <div className="flex items-center">
                <Key className="w-5 h-5 mr-2" />
                <span>Gate Code: {service.gateCode || service.customer?.gateCode}</span>
              </div>
            )}
            <div className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              <span>{service.customer?.name || service.customerName || 'Customer'}</span>
            </div>
          </div>
          {(service.notes || service.specialInstructions) && (
            <div className="mt-4 p-4 bg-yellow-50 rounded">
              <AlertCircle className="w-5 h-5 text-yellow-500 inline-block mr-2" />
              <span className="text-yellow-700">{service.notes || service.specialInstructions}</span>
            </div>
          )}
        </div>

        {!arrived && (
          <div className="mb-6">
            <Button onClick={handleArrival} disabled={busy} className="w-full">
              <CheckCircle className="w-5 h-5 mr-2" />
              {busy ? 'Checking in...' : 'Confirm Arrival'}
            </Button>
          </div>
        )}

        {arrived && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Service Checklist</h2>
              <ServiceChecklist
                serviceId={serviceId}
                initialChecklist={service.checklist}
                onComplete={setChecklistComplete}
              />
            </div>

            {checklistComplete && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">Cleanup photo</h2>
                <ServicePhotoUpload
                  serviceId={serviceId}
                  type="AFTER"
                  existingCount={afterCount}
                  required={1}
                  onUploadComplete={refreshPhotos}
                />
              </div>
            )}

            <div className="mt-6">
              <Button onClick={handleComplete} disabled={!canComplete} className="w-full">
                <CheckCircle className="w-5 h-5 mr-2" />
                {busy ? 'Completing...' : 'Complete Service'}
              </Button>
              {!photosReady && (
                <p className="mt-2 text-sm text-gray-500 text-center">
                  Need one after/cleanup photo ({afterCount}/1)
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
