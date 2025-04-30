'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { MapPinIcon, ClockIcon, CameraIcon, CheckCircleIcon, MapIcon } from '@heroicons/react/24/outline';
import dynamic from 'next/dynamic';
// Dynamically import the Map component to avoid SSR issues
const Map = dynamic(() => import('@/components/Map'), { ssr: false });
export default function ServicePage() {
    const router = useRouter();
    const params = useParams();
    const serviceId = params.id;
    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [preCleanPhotos, setPreCleanPhotos] = useState([]);
    const [postCleanPhotos, setPostCleanPhotos] = useState([]);
    const [checklist, setChecklist] = useState({
        gatesClosed: false,
        gatesLocked: false,
        gatesSecured: false,
        gatesChecked: false,
        gatesVerified: false,
        gatesConfirmed: false,
        gatesInspected: false,
        gatesValidated: false,
        gatesApproved: false,
        gatesCompleted: false
    });
    const [showMap, setShowMap] = useState(false);
    const [showPhotos, setShowPhotos] = useState(false);
    const [manualCheckIn, setManualCheckIn] = useState(false);
    useEffect(() => {
        if (!serviceId)
            return;
        fetchService();
    }, [id]);
    const fetchService = async () => {
        try {
            const response = await fetch(`/api/services/${id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!response.ok)
                throw new Error('Failed to fetch service');
            const data = await response.json();
            setService(data);
            if (data.checklist) {
                setChecklist(data.checklist);
            }
            const prePhotos = data.photos.filter((p) => p.type === 'PRE_CLEAN').map((p) => p.url);
            const postPhotos = data.photos.filter((p) => p.type === 'POST_CLEAN').map((p) => p.url);
            setPreCleanPhotos(prePhotos);
            setPostCleanPhotos(postPhotos);
            setError(null);
        }
        catch (err) {
            setError('Failed to load service');
            console.error(err);
        }
        finally {
            setLoading(false);
        }
    };
    const handleArrival = async () => {
        try {
            let locationData;
            if (!manualCheckIn) {
                // Get current location
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject);
                });
                locationData = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };
            }
            else {
                // Use manual check-in
                locationData = {
                    latitude: 0, // You might want to get this from a form input
                    longitude: 0,
                    isManual: true
                };
            }
            const response = await fetch(`/api/employee/services/${id}/arrive`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(locationData)
            });
            if (!response.ok)
                throw new Error('Failed to confirm arrival');
            fetchService();
        }
        catch (err) {
            setError('Failed to confirm arrival');
            console.error(err);
        }
    };
    const handlePhotoUpload = async (files, type) => {
        try {
            // Here you would normally upload to your storage service (S3, etc)
            // For now, we'll simulate with a local URL
            const urls = Array.from(files).map(file => URL.createObjectURL(file));
            for (const url of urls) {
                const response = await fetch(`/api/services/${id}/photos`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ url, type })
                });
                if (!response.ok)
                    throw new Error('Failed to upload photo');
            }
            if (type === 'PRE_CLEAN') {
                setPreCleanPhotos([...preCleanPhotos, ...urls]);
            }
            else {
                setPostCleanPhotos([...postCleanPhotos, ...urls]);
            }
        }
        catch (err) {
            setError('Failed to upload photos');
            console.error(err);
        }
    };
    const handleChecklistUpdate = async (updates) => {
        try {
            const response = await fetch(`/api/services/${id}/checklist`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(Object.assign(Object.assign({}, checklist), updates))
            });
            if (!response.ok)
                throw new Error('Failed to update checklist');
            setChecklist(Object.assign(Object.assign({}, checklist), updates));
        }
        catch (err) {
            setError('Failed to update checklist');
            console.error(err);
        }
    };
    const handleComplete = async () => {
        try {
            const response = await fetch(`/api/employee/services/${id}/complete`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    preCleanPhotos,
                    postCleanPhotos,
                    gateClosed: checklist.gatesClosed,
                    checklistItems: Object.entries(checklist)
                        .filter(([key, value]) => value)
                        .map(([key]) => key)
                })
            });
            if (!response.ok)
                throw new Error('Failed to complete service');
            router.push('/employee/dashboard?completed=true');
        }
        catch (err) {
            setError('Failed to complete service');
            console.error(err);
        }
    };
    if (loading)
        return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
    if (!service)
        return <div className="flex justify-center items-center min-h-screen">Service not found</div>;
    return (<div className="container mx-auto px-4 py-8">
      {error && (<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>)}

      {/* Service Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">{service.customer.name}</h1>
          <div className="flex space-x-2">
            <button onClick={() => setShowMap(!showMap)} className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-3 py-1 rounded">
              <MapIcon className="h-5 w-5"/>
              <span>Map</span>
            </button>
            <button onClick={() => setShowPhotos(!showPhotos)} className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-3 py-1 rounded">
              <CameraIcon className="h-5 w-5"/>
              <span>Photos</span>
            </button>
          </div>
        </div>
        <div className="flex items-start mb-4">
          <MapPinIcon className="h-5 w-5 text-gray-500 mr-2"/>
          <div>
            <p className="text-gray-600">{service.customer.address.street}</p>
            <p className="text-gray-600">
              {service.customer.address.city}, {service.customer.address.state} {service.customer.address.zipCode}
            </p>
          </div>
        </div>
        <div className="flex items-center mb-4">
          <ClockIcon className="h-5 w-5 text-gray-500 mr-2"/>
          <p className="text-gray-600">
            {new Date(service.scheduledFor).toLocaleString()}
          </p>
        </div>
        {service.customer.gateCode && (<div className="bg-blue-50 border border-blue-200 rounded p-4">
            <p className="text-blue-800">Gate Code: {service.customer.gateCode}</p>
          </div>)}
      </div>

      {/* Map View */}
      {showMap && (<div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Location Map</h2>
          <div className="h-96 w-full">
            <Map address={`${service.customer.address.street}, ${service.customer.address.city}, ${service.customer.address.state} ${service.customer.address.zipCode}`}/>
          </div>
        </div>)}

      {/* Photo Gallery */}
      {showPhotos && (<div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Photo Gallery</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {service.photos.map((photo, index) => (<div key={photo.id} className="relative">
                <img src={photo.url} alt={`${photo.type} photo ${index + 1}`} className="w-full h-48 object-cover rounded"/>
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
                  {photo.type === 'PRE_CLEAN' ? 'Before' : 'After'}
                </div>
              </div>))}
          </div>
        </div>)}

      {/* Service Actions */}
      <div className="space-y-8">
        {/* Arrival Section */}
        {service.status === 'CLAIMED' && (<div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Arrival</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input type="checkbox" checked={manualCheckIn} onChange={(e) => setManualCheckIn(e.target.checked)} className="h-4 w-4 text-blue-600 rounded"/>
                <label className="text-gray-700">Manual Check-in (GPS not working)</label>
              </div>
              <button onClick={handleArrival} className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors">
                I Have Arrived
              </button>
            </div>
          </div>)}

        {/* Pre-Clean Photos Section */}
        {service.status === 'ARRIVED' && (<div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Pre-Clean Photos</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {preCleanPhotos.map((url, index) => (<img key={index} src={url} alt={`Pre-clean photo ${index + 1}`} className="w-full h-48 object-cover rounded"/>))}
            </div>
            {preCleanPhotos.length < 4 && (<div className="flex items-center justify-center w-full">
                <label className="w-full flex flex-col items-center px-4 py-6 bg-gray-50 rounded-lg border-2 border-gray-300 border-dashed cursor-pointer hover:bg-gray-100">
                  <CameraIcon className="h-12 w-12 text-gray-400"/>
                  <p className="mt-2 text-sm text-gray-500">Take photos (at least 4 required)</p>
                  <input type="file" className="hidden" accept="image/*" multiple onChange={(e) => e.target.files && handlePhotoUpload(e.target.files, 'PRE_CLEAN')}/>
                </label>
              </div>)}
          </div>)}

        {/* Checklist Section */}
        {preCleanPhotos.length >= 4 && service.status !== 'COMPLETED' && (<div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Service Checklist</h2>
            <div className="space-y-4">
              {Object.entries(checklist).map(([key, value]) => (<label key={key} className="flex items-center space-x-3">
                  <input type="checkbox" checked={value} onChange={(e) => handleChecklistUpdate({ [key]: e.target.checked })} className="h-5 w-5 text-blue-600 rounded"/>
                  <span className="text-gray-700">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                </label>))}
            </div>
          </div>)}

        {/* Post-Clean Photos Section */}
        {Object.values(checklist).every(Boolean) && service.status !== 'COMPLETED' && (<div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Post-Clean Photos</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {postCleanPhotos.map((url, index) => (<img key={index} src={url} alt={`Post-clean photo ${index + 1}`} className="w-full h-48 object-cover rounded"/>))}
            </div>
            {postCleanPhotos.length < 4 && (<div className="flex items-center justify-center w-full">
                <label className="w-full flex flex-col items-center px-4 py-6 bg-gray-50 rounded-lg border-2 border-gray-300 border-dashed cursor-pointer hover:bg-gray-100">
                  <CameraIcon className="h-12 w-12 text-gray-400"/>
                  <p className="mt-2 text-sm text-gray-500">Take photos (at least 4 required)</p>
                  <input type="file" className="hidden" accept="image/*" multiple onChange={(e) => e.target.files && handlePhotoUpload(e.target.files, 'POST_CLEAN')}/>
                </label>
              </div>)}
          </div>)}

        {/* Complete Button */}
        {postCleanPhotos.length >= 4 && Object.values(checklist).every(Boolean) && service.status !== 'COMPLETED' && (<button onClick={handleComplete} className="w-full bg-green-500 text-white py-4 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2">
            <CheckCircleIcon className="h-6 w-6"/>
            <span>Complete Service</span>
          </button>)}
      </div>
    </div>);
}
