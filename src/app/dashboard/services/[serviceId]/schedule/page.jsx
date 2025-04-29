'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { format } from 'date-fns';
export default function ScheduleServicePage() {
    const router = useRouter();
    const params = useParams();
    const serviceId = params.serviceId;
    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [scheduledDate, setScheduledDate] = useState('');
    const [isCancelling, setIsCancelling] = useState(false);
    useEffect(() => {
        if (!serviceId)
            return;
        const fetchService = async () => {
            try {
                const response = await fetch(`/api/services/${serviceId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch service');
                }
                const data = await response.json();
                setService(data);
                if (data.scheduledDate) {
                    setScheduledDate(format(new Date(data.scheduledDate), "yyyy-MM-dd'T'HH:mm"));
                }
            }
            catch (error) {
                console.error('Service fetch error:', error);
                toast.error('Failed to load service');
            }
            finally {
                setLoading(false);
            }
        };
        fetchService();
    }, [serviceId]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const response = await fetch(`/api/services/${serviceId}/schedule`, {
                method: (service === null || service === void 0 ? void 0 : service.scheduledDate) ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ scheduledDate }),
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to schedule service');
            }
            toast.success('Service scheduled successfully!');
            router.push('/dashboard/services');
        }
        catch (error) {
            console.error('Service scheduling error:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to schedule service');
        }
        finally {
            setSaving(false);
        }
    };
    const handleCancel = async () => {
        var _a;
        if (!serviceId)
            return;
        try {
            setIsCancelling(true);
            // Get token from cookies
            const token = (_a = document.cookie
                .split('; ')
                .find(row => row.startsWith('token='))) === null || _a === void 0 ? void 0 : _a.split('=')[1];
            if (!token) {
                toast.error('You must be logged in to cancel a service');
                return;
            }
            const response = await fetch(`/api/customer/services/${serviceId}/cancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                toast.success('Service cancelled successfully');
                setService(Object.assign(Object.assign({}, service), { status: 'CANCELLED' }));
            }
            else {
                toast.error(data.error || 'Error cancelling service');
            }
        }
        catch (error) {
            console.error('Error cancelling service:', error);
            toast.error('Failed to cancel service. Please try again.');
        }
        finally {
            setIsCancelling(false);
        }
    };
    if (loading) {
        return (<div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Loading service...</h2>
        </div>
      </div>);
    }
    if (!service) {
        return (<div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Service not found</h2>
          <Button className="mt-4" onClick={() => router.push('/dashboard/services')}>
            Return to Services
          </Button>
        </div>
      </div>);
    }
    return (<div className="container mx-auto max-w-4xl py-8">
      <h1 className="mb-8 text-3xl font-bold">
        {service.scheduledDate ? 'Reschedule Service' : 'Schedule Service'}
      </h1>

      <div className="mb-8 rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">{service.name}</h2>
        <p className="mb-4 text-neutral-600">{service.description}</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-semibold">Duration</p>
            <p>{service.duration} minutes</p>
          </div>
          <div>
            <p className="font-semibold">Price</p>
            <p>${service.price.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <Label htmlFor="scheduledDate">Scheduled Date and Time</Label>
          <Input id="scheduledDate" type="datetime-local" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} required min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}/>
        </div>

        <div className="flex justify-end space-x-4">
          {service.scheduledDate && (<Button type="button" variant="destructive" onClick={handleCancel} disabled={saving || isCancelling}>
              Cancel Service
            </Button>)}
          <Button type="submit" disabled={saving}>
            {saving
            ? 'Saving...'
            : service.scheduledDate
                ? 'Reschedule'
                : 'Schedule'}
          </Button>
        </div>
      </form>
    </div>);
}
