'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Camera } from 'lucide-react';
export default function CompleteServicePage() {
    const router = useRouter();
    const params = useParams();
    const serviceId = params.serviceId;
    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [photos, setPhotos] = useState([]);
    const [checklist, setChecklist] = useState({
        gateClosedOnEntry: false,
        yardCleaned: false,
        gateClosedOnExit: false,
    });
    useEffect(() => {
        if (!serviceId)
            return;
        fetchService();
    }, [serviceId]);
    const fetchService = async () => {
        try {
            const response = await fetch(`/api/services/${serviceId}`);
            if (response.ok) {
                const data = await response.json();
                setService(data);
            }
            else {
                throw new Error('Failed to fetch service');
            }
        }
        catch (err) {
            setError('Failed to load service');
            toast.error('Failed to load service');
        }
        finally {
            setLoading(false);
        }
    };
    const handlePhotoUpload = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length + photos.length > 8) {
            toast.error('Maximum 8 photos allowed');
            return;
        }
        setPhotos([...photos, ...files]);
    };
    const handleChecklistChange = (field) => {
        setChecklist(prev => (Object.assign(Object.assign({}, prev), { [field]: !prev[field] })));
    };
    const handleSubmit = async () => {
        if (!checklist.gateClosedOnEntry || !checklist.yardCleaned || !checklist.gateClosedOnExit) {
            toast.error('Please complete all checklist items');
            return;
        }
        if (photos.length !== 8) {
            toast.error('Please upload all required photos (4 before, 4 after)');
            return;
        }
        try {
            // Upload photos
            const photoUrls = await Promise.all(photos.map(async (photo, index) => {
                const formData = new FormData();
                formData.append('file', photo);
                formData.append('type', index < 4 ? 'PRE_SERVICE' : 'POST_SERVICE');
                formData.append('corner', (index % 4 + 1).toString());
                const response = await fetch(`/api/services/${serviceId}/photos`, {
                    method: 'POST',
                    body: formData,
                });
                if (!response.ok) {
                    throw new Error('Failed to upload photo');
                }
                return response.json();
            }));
            // Update service status
            const response = await fetch(`/api/services/${serviceId}/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    checklist,
                    photoUrls,
                }),
            });
            if (response.ok) {
                toast.success('Service completed successfully');
                router.push('/employee/dashboard');
            }
            else {
                throw new Error('Failed to complete service');
            }
        }
        catch (err) {
            toast.error('Failed to complete service');
        }
    };
    if (loading) {
        return <div>Loading...</div>;
    }
    if (!service) {
        return <div>Service not found</div>;
    }
    return (<div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Complete Service</h1>

      <div className="grid gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Service Details</h2>
          <p className="text-gray-600">
            {service.customer.address.street}, {service.customer.address.city}
          </p>
          {service.customer.gateCode && (<p className="text-gray-600 mt-2">
              Gate Code: {service.customer.gateCode}
            </p>)}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Photos</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">Before Service</h3>
              <div className="grid grid-cols-2 gap-2">
                {[...Array(4)].map((_, i) => (<div key={`before-${i}`} className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center">
                    {photos[i] ? (<img src={URL.createObjectURL(photos[i])} alt={`Before corner ${i + 1}`} className="max-w-full h-auto"/>) : (<Camera className="w-8 h-8 text-gray-400"/>)}
                  </div>))}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">After Service</h3>
              <div className="grid grid-cols-2 gap-2">
                {[...Array(4)].map((_, i) => (<div key={`after-${i}`} className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center">
                    {photos[i + 4] ? (<img src={URL.createObjectURL(photos[i + 4])} alt={`After corner ${i + 1}`} className="max-w-full h-auto"/>) : (<Camera className="w-8 h-8 text-gray-400"/>)}
                  </div>))}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" id="photo-upload"/>
            <label htmlFor="photo-upload">
              <Button asChild>
                <span>Upload Photos</span>
              </Button>
            </label>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Checklist</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="gateClosedOnEntry" checked={checklist.gateClosedOnEntry} onCheckedChange={() => handleChecklistChange('gateClosedOnEntry')}/>
              <Label htmlFor="gateClosedOnEntry">
                Gate was closed upon entry
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="yardCleaned" checked={checklist.yardCleaned} onCheckedChange={() => handleChecklistChange('yardCleaned')}/>
              <Label htmlFor="yardCleaned">
                Yard was thoroughly cleaned
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="gateClosedOnExit" checked={checklist.gateClosedOnExit} onCheckedChange={() => handleChecklistChange('gateClosedOnExit')}/>
              <Label htmlFor="gateClosedOnExit">
                Gate was closed upon exit
              </Label>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={!checklist.gateClosedOnEntry || !checklist.yardCleaned || !checklist.gateClosedOnExit || photos.length !== 8}>
            Complete Service
          </Button>
        </div>
      </div>
    </div>);
}
