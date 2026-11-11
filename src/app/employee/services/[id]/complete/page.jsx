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
  const [pending, setPending] = useState(null);
  const [uploadedAfter, setUploadedAfter] = useState([]);
  const [checklist, setChecklist] = useState({
    gateClosedOnEntry: false,
    yardCleaned: false,
    gateClosedOnExit: false,
  });

  const refreshPhotos = useCallback(async () => {
    if (!serviceId) return;
    const data = await listJobPhotos(serviceId);
    setUploadedAfter(data.byType?.after || []);
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
    const file = (e.target.files || [])[0];
    e.target.value = '';
    if (!file) return;
    if (pending?.url) URL.revokeObjectURL(pending.url);
    setPending({
      id: `${Date.now()}-${file.name}`,
      file,
      url: URL.createObjectURL(file),
    });
  };

  const handleChecklistChange = (field) => {
    setChecklist((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async () => {
    if (!checklist.gateClosedOnEntry || !checklist.yardCleaned || !checklist.gateClosedOnExit) {
      toast.error('Please complete all checklist items');
      return;
    }
    if (uploadedAfter.length < 1 && !pending) {
      toast.error('Please upload one after/cleanup photo');
      return;
    }

    setBusy(true);
    try {
      if (pending) {
        await uploadJobPhoto(serviceId, pending.file, 'AFTER');
        if (pending.url) URL.revokeObjectURL(pending.url);
        setPending(null);
        await refreshPhotos();
      }

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

  const preview = pending || uploadedAfter[0];
  const checklistReady = checklist.gateClosedOnEntry && checklist.yardCleaned && checklist.gateClosedOnExit;
  const photosReady = Boolean(preview);

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
          <h2 className="text-xl font-semibold mb-4">Cleanup photo</h2>
          <p className="text-sm text-gray-500 mb-4">
            Upload one clear after photo of the cleaned yard. It is emailed to the customer and held for about 7 days.
          </p>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center min-h-40 max-w-sm">
            {preview ? (
              <img src={preview.url} alt="Cleanup photo" className="max-w-full h-auto" />
            ) : (
              <Camera className="w-10 h-10 text-gray-400" />
            )}
          </div>

          <div className="mt-4">
            <input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/*" onChange={handlePhotoUpload} className="hidden" id="photo-upload" />
            <label htmlFor="photo-upload">
              <Button asChild disabled={busy}>
                <span>{preview ? 'Replace photo' : 'Upload cleanup photo'}</span>
              </Button>
            </label>
            <p className="mt-2 text-sm text-gray-500">
              Photos up to 4 MB upload through the app. Larger photos need AWS storage configured.
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
