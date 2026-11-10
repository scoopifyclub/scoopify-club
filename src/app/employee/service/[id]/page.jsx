'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { MapPinIcon, ClockIcon, CameraIcon, CheckCircleIcon, MapIcon } from '@heroicons/react/24/outline';
import dynamic from 'next/dynamic';
import {
  getJob,
  listJobPhotos,
  checkInToJob,
  uploadJobPhoto,
  saveJobChecklist,
  completeJob,
  completionErrorMessage,
  JobApiError,
} from '@/lib/job-api-client';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

const CHECKLIST_LABELS = {
  allWasteRemoved: 'All waste removed',
  gateClosed: 'Gate closed and secured',
  cornersCleaned: 'All corners cleaned',
  areaRaked: 'Area raked and smoothed',
};

export default function ServicePage() {
  const router = useRouter();
  const params = useParams();
  const serviceId = params.id;
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [preCleanPhotos, setPreCleanPhotos] = useState([]);
  const [postCleanPhotos, setPostCleanPhotos] = useState([]);
  const [checklist, setChecklist] = useState({
    allWasteRemoved: false,
    gateClosed: false,
    cornersCleaned: false,
    areaRaked: false,
  });
  const [showMap, setShowMap] = useState(false);
  const [showPhotos, setShowPhotos] = useState(false);
  const [manualCheckIn, setManualCheckIn] = useState(false);

  const refreshPhotos = useCallback(async () => {
    const data = await listJobPhotos(serviceId);
    setPreCleanPhotos(data.byType?.before || []);
    setPostCleanPhotos(data.byType?.after || []);
  }, [serviceId]);

  const fetchService = useCallback(async () => {
    if (!serviceId) return;
    try {
      const data = await getJob(serviceId);
      setService(data);
      const items = data.checklist?.items || {};
      setChecklist({
        allWasteRemoved: Boolean(items.allWasteRemoved || items.wasteDisposed || items.yardCleaned),
        gateClosed: Boolean(items.gateClosed || items.gateClosedOnExit || items.gatesClosed || items.gatesSecured),
        cornersCleaned: Boolean(items.cornersCleaned),
        areaRaked: Boolean(items.areaRaked),
      });
      await refreshPhotos();
      setError(null);
    } catch (err) {
      setError(err instanceof JobApiError ? err.message : 'Failed to load service');
      console.error(err);
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
      const updated = await checkInToJob(serviceId, {
        geolocation: manualCheckIn ? null : globalThis.navigator?.geolocation,
      });
      setService((prev) => ({ ...prev, ...updated, status: 'IN_PROGRESS' }));
      setError(null);
    } catch (err) {
      setError(err instanceof JobApiError ? err.message : 'Failed to confirm arrival');
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  const handlePhotoUpload = async (files, type) => {
    try {
      const photoType = type === 'PRE_CLEAN' || type === 'BEFORE' ? 'BEFORE' : 'AFTER';
      for (const file of Array.from(files)) {
        await uploadJobPhoto(serviceId, file, photoType);
      }
      await refreshPhotos();
      setError(null);
    } catch (err) {
      setError(err instanceof JobApiError ? err.message : 'Failed to upload photos');
      console.error(err);
    }
  };

  const handleChecklistUpdate = async (updates) => {
    const next = { ...checklist, ...updates };
    setChecklist(next);
    try {
      await saveJobChecklist(serviceId, next);
      setError(null);
    } catch (err) {
      setError(err instanceof JobApiError ? err.message : 'Failed to update checklist');
      console.error(err);
    }
  };

  const handleComplete = async () => {
    setBusy(true);
    try {
      await completeJob(serviceId, { checklist });
      router.push('/employee/dashboard?completed=true');
    } catch (err) {
      setError(completionErrorMessage(err));
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  if (!service) return <div className="flex justify-center items-center min-h-screen">Service not found</div>;

  const customer = service.customer || {};
  const address = customer.address || {};
  const customerName = customer.name || [customer.user?.firstName, customer.user?.lastName].filter(Boolean).join(' ') || 'Customer';
  const status = service.status;
  const notCheckedIn = status === 'PENDING' && !service.arrivedAt;
  const inProgress = status === 'IN_PROGRESS' || Boolean(service.arrivedAt);
  const checklistReady = checklist.allWasteRemoved && checklist.gateClosed
    && checklist.cornersCleaned && checklist.areaRaked;
  const addressLine = [address.street, address.city, address.state, address.zipCode].filter(Boolean).join(', ');

  return (
    <div className="container mx-auto px-4 py-8">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">{customerName}</h1>
          <div className="flex space-x-2">
            <button onClick={() => setShowMap(!showMap)} className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-3 py-1 rounded">
              <MapIcon className="h-5 w-5" />
              <span>Map</span>
            </button>
            <button onClick={() => setShowPhotos(!showPhotos)} className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-3 py-1 rounded">
              <CameraIcon className="h-5 w-5" />
              <span>Photos</span>
            </button>
          </div>
        </div>
        <div className="flex items-start mb-4">
          <MapPinIcon className="h-5 w-5 text-gray-500 mr-2" />
          <div>
            <p className="text-gray-600">{address.street}</p>
            <p className="text-gray-600">
              {[address.city, address.state, address.zipCode].filter(Boolean).join(' ')}
            </p>
          </div>
        </div>
        <div className="flex items-center mb-4">
          <ClockIcon className="h-5 w-5 text-gray-500 mr-2" />
          <p className="text-gray-600">
            {new Date(service.scheduledDate || service.scheduledFor).toLocaleString()}
          </p>
        </div>
        {(customer.gateCode || service.gateCode) && (
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <p className="text-blue-800">Gate Code: {customer.gateCode || service.gateCode}</p>
          </div>
        )}
      </div>

      {showMap && addressLine && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Location Map</h2>
          <div className="h-96 w-full">
            <Map address={addressLine} />
          </div>
        </div>
      )}

      {showPhotos && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Photo Gallery</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...preCleanPhotos, ...postCleanPhotos].map((photo, index) => (
              <div key={photo.id || index} className="relative">
                <img src={photo.url} alt={`${photo.type} photo ${index + 1}`} className="w-full h-48 object-cover rounded" />
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
                  {photo.type === 'BEFORE' ? 'Before' : 'After'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-8">
        {notCheckedIn && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Arrival</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input type="checkbox" checked={manualCheckIn} onChange={(e) => setManualCheckIn(e.target.checked)} className="h-4 w-4 text-blue-600 rounded" />
                <label className="text-gray-700">Manual Check-in (GPS not working)</label>
              </div>
              <button onClick={handleArrival} disabled={busy} className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-60">
                {busy ? 'Checking in...' : 'I Have Arrived'}
              </button>
            </div>
          </div>
        )}

        {inProgress && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Pre-Clean Photos</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {preCleanPhotos.map((photo, index) => (
                <img key={photo.id || index} src={photo.url} alt={`Pre-clean photo ${index + 1}`} className="w-full h-48 object-cover rounded" />
              ))}
            </div>
            {preCleanPhotos.length < 4 && (
              <div className="flex items-center justify-center w-full">
                <label className="w-full flex flex-col items-center px-4 py-6 bg-gray-50 rounded-lg border-2 border-gray-300 border-dashed cursor-pointer hover:bg-gray-100">
                  <CameraIcon className="h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">Take photos (at least 4 required)</p>
                  <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/*" multiple onChange={(e) => e.target.files && handlePhotoUpload(e.target.files, 'BEFORE')} />
                </label>
              </div>
            )}
          </div>
        )}

        {preCleanPhotos.length >= 4 && status !== 'COMPLETED' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Service Checklist</h2>
            <div className="space-y-4">
              {Object.entries(CHECKLIST_LABELS).map(([key, label]) => (
                <label key={key} className="flex items-center space-x-3">
                  <input type="checkbox" checked={checklist[key]} onChange={(e) => handleChecklistUpdate({ [key]: e.target.checked })} className="h-5 w-5 text-blue-600 rounded" />
                  <span className="text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {checklistReady && status !== 'COMPLETED' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Post-Clean Photos</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {postCleanPhotos.map((photo, index) => (
                <img key={photo.id || index} src={photo.url} alt={`Post-clean photo ${index + 1}`} className="w-full h-48 object-cover rounded" />
              ))}
            </div>
            {postCleanPhotos.length < 4 && (
              <div className="flex items-center justify-center w-full">
                <label className="w-full flex flex-col items-center px-4 py-6 bg-gray-50 rounded-lg border-2 border-gray-300 border-dashed cursor-pointer hover:bg-gray-100">
                  <CameraIcon className="h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">Take photos (at least 4 required)</p>
                  <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/*" multiple onChange={(e) => e.target.files && handlePhotoUpload(e.target.files, 'AFTER')} />
                </label>
              </div>
            )}
          </div>
        )}

        {postCleanPhotos.length >= 4 && checklistReady && status !== 'COMPLETED' && (
          <button onClick={handleComplete} disabled={busy} className="w-full bg-green-500 text-white py-4 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2 disabled:opacity-60">
            <CheckCircleIcon className="h-6 w-6" />
            <span>{busy ? 'Completing...' : 'Complete Service'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
