'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Camera } from 'lucide-react';
import {
  getJob,
  listJobPhotos,
  checkInToJob,
  uploadJobPhoto,
  completeJob,
  completionErrorMessage,
  JobApiError,
} from '@/lib/job-api-client';

function formatAddress(service) {
  const address = service?.customer?.address;
  if (!address) return 'Address unavailable';
  return [address.street, address.city, address.state, address.zipCode].filter(Boolean).join(', ');
}

export default function CompleteServicePage() {
  const router = useRouter();
  const params = useParams();
  const serviceId = params.id;
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState([]);
  const [uploaded, setUploaded] = useState({ before: [], after: [] });
  const [checklist, setChecklist] = useState({
    gateClosedOnEntry: false,
    yardCleaned: false,
    gateClosedOnExit: false,
  });

  const refreshPhotos = useCallback(async () => {
    if (!serviceId) return;
    const data = await listJobPhotos(serviceId);
    setUploaded({
      before: data.byType?.before || [],
      after: data.byType?.after || [],
    });
  }, [serviceId]);

  const fetchService = useCallback(async () => {
    if (!serviceId) return;
    try {
      const data = await getJob(serviceId);
      setService(data);
      if (data.status === 'PENDING' && !data.arrivedAt) {
        try {
          const checkedIn = await checkInToJob(serviceId);
          setService((prev) => ({ ...prev, ...checkedIn, status: 'IN_PROGRESS' }));
        } catch (checkInError) {
          toast.error(checkInError instanceof JobApiError
            ? checkInError.message
            : 'Check in before completing this job');
        }
      }
      const items = data.checklist?.items || {};
      setChecklist({
        gateClosedOnEntry: Boolean(items.gateClosedOnEntry),
        yardCleaned: Boolean(items.yardCleaned || items.allWasteRemoved || items.wasteDisposed),
        gateClosedOnExit: Boolean(items.gateClosedOnExit || items.gateClosed),
      });
      await refreshPhotos();
    } catch (err) {
      toast.error(err instanceof JobApiError ? err.message : 'Failed to load service');
      setService(null);
    } finally {
      setLoading(false);
    }
  }, [serviceId, refreshPhotos]);

  useEffect(() => {
    fetchService();
  }, [fetchService]);

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;
    const already = uploaded.before.length + uploaded.after.length + pending.length;
    if (already + files.length > 8) {
      toast.error('Maximum 8 photos allowed');
      return;
    }
    setPending((prev) => [
      ...prev,
      ...files.map((file) => ({
        id: `${Date.now()}-${file.name}-${Math.random().toString(36).slice(2, 6)}`,
        file,
        url: URL.createObjectURL(file),
      })),
    ]);
  };

  const handleChecklistChange = (field) => {
    setChecklist((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async () => {
    if (!checklist.gateClosedOnEntry || !checklist.yardCleaned || !checklist.gateClosedOnExit) {
      toast.error('Please complete all checklist items');
      return;
    }
    const totalPhotos = uploaded.before.length + uploaded.after.length + pending.length;
    if (totalPhotos < 8) {
      toast.error('Please upload all required photos (4 before, 4 after)');
      return;
    }

    setBusy(true);
    try {
      // First four slots are before, the rest after; fill remaining slots from pending files.
      let beforeLeft = Math.max(0, 4 - uploaded.before.length);
      for (const item of pending) {
        const type = beforeLeft > 0 ? 'BEFORE' : 'AFTER';
        if (beforeLeft > 0) beforeLeft -= 1;
        await uploadJobPhoto(serviceId, item.file, type);
      }
      pending.forEach((item) => item.url && URL.revokeObjectURL(item.url));
      setPending([]);
      await refreshPhotos();

      await completeJob(serviceId, { checklist });
      toast.success('Service completed successfully');
      router.push('/employee/dashboard');
    } catch (err) {
      toast.error(completionErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }
  if (!service) {
    return <div>Service not found</div>;
  }

  const slots = [...uploaded.before, ...uploaded.after, ...pending];
  const checklistReady = checklist.gateClosedOnEntry && checklist.yardCleaned && checklist.gateClosedOnExit;
  const photosReady = slots.length >= 8;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Complete Service</h1>

      <div className="grid gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Service Details</h2>
          <p className="text-gray-600">{formatAddress(service)}</p>
          {(service.customer?.gateCode || service.gateCode) && (
            <p className="text-gray-600 mt-2">
              Gate Code: {service.customer?.gateCode || service.gateCode}
            </p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Photos</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">Before Service</h3>
              <div className="grid grid-cols-2 gap-2">
                {[...Array(4)].map((_, i) => {
                  const slot = slots[i];
                  return (
                    <div key={`before-${i}`} className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center min-h-24">
                      {slot ? (
                        <img src={slot.url} alt={`Before corner ${i + 1}`} className="max-w-full h-auto" />
                      ) : (
                        <Camera className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">After Service</h3>
              <div className="grid grid-cols-2 gap-2">
                {[...Array(4)].map((_, i) => {
                  const slot = slots[i + 4];
                  return (
                    <div key={`after-${i}`} className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center min-h-24">
                      {slot ? (
                        <img src={slot.url} alt={`After corner ${i + 1}`} className="max-w-full h-auto" />
                      ) : (
                        <Camera className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/*" multiple onChange={handlePhotoUpload} className="hidden" id="photo-upload" />
            <label htmlFor="photo-upload">
              <Button asChild disabled={busy}>
                <span>Upload Photos</span>
              </Button>
            </label>
            <p className="mt-2 text-sm text-gray-500">
              Photos over 4 MB upload directly to storage (up to 10 MB).
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Checklist</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="gateClosedOnEntry" checked={checklist.gateClosedOnEntry} onCheckedChange={() => handleChecklistChange('gateClosedOnEntry')} />
              <Label htmlFor="gateClosedOnEntry">Gate was closed upon entry</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="yardCleaned" checked={checklist.yardCleaned} onCheckedChange={() => handleChecklistChange('yardCleaned')} />
              <Label htmlFor="yardCleaned">Yard was thoroughly cleaned</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="gateClosedOnExit" checked={checklist.gateClosedOnExit} onCheckedChange={() => handleChecklistChange('gateClosedOnExit')} />
              <Label htmlFor="gateClosedOnExit">Gate was closed upon exit</Label>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={busy || !checklistReady || !photosReady}>
            {busy ? 'Completing...' : 'Complete Service'}
          </Button>
        </div>
      </div>
    </div>
  );
}
