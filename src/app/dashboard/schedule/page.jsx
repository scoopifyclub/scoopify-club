'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { toast } from 'sonner';
import { addDays, isBefore, startOfToday } from 'date-fns';
const timeSlots = [
    '8:00 AM',
    '9:00 AM',
    '10:00 AM',
    '11:00 AM',
    '12:00 PM',
    '1:00 PM',
    '2:00 PM',
    '3:00 PM',
    '4:00 PM',
];
export default function ScheduleService() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        date: undefined,
        timeSlot: '',
        serviceType: 'regular',
        notes: '',
        numberOfDogs: 1,
    });
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.date || !formData.timeSlot) {
            toast.error('Please select both date and time');
            return;
        }
        setLoading(true);
        try {
            const response = await fetch('/api/services/schedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({
                    scheduledFor: new Date(formData.date.getFullYear(), formData.date.getMonth(), formData.date.getDate(), ...formData.timeSlot.split(':').map(Number)).toISOString(),
                    serviceType: formData.serviceType,
                    notes: formData.notes,
                    numberOfDogs: formData.numberOfDogs,
                }),
            });
            if (!response.ok) {
                throw new Error('Failed to schedule service');
            }
            toast.success('Service scheduled successfully!');
            router.push('/dashboard/services');
        }
        catch (error) {
            toast.error('Failed to schedule service. Please try again.');
            console.error('Error scheduling service:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const isDateDisabled = (date) => {
        // Disable past dates and next day (need 24h notice)
        return isBefore(date, addDays(startOfToday(), 1));
    };
    return (<DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Schedule Service</h1>
          <Button variant="outline" onClick={() => window.history.back()}>
            Back to Dashboard
          </Button>
        </div>

        <div className="max-w-4xl mx-auto p-6">
          <h1 className="text-3xl font-bold mb-8">Schedule a Service</h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Select Date</label>
                  <Calendar mode="single" selected={formData.date} onSelect={(date) => setFormData(Object.assign(Object.assign({}, formData), { date }))} disabled={isDateDisabled} className="rounded-md border"/>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Select Time</label>
                  <Select value={formData.timeSlot} onValueChange={(value) => setFormData(Object.assign(Object.assign({}, formData), { timeSlot: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a time slot"/>
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((slot) => (<SelectItem key={slot} value={slot}>
                          {slot}
                        </SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Service Type</label>
                  <Select value={formData.serviceType} onValueChange={(value) => setFormData(Object.assign(Object.assign({}, formData), { serviceType: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Regular Service</SelectItem>
                      <SelectItem value="one-time">One-time Cleanup</SelectItem>
                      <SelectItem value="extra">Extra Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Number of Dogs</label>
                  <Input type="number" min={1} max={10} value={formData.numberOfDogs} onChange={(e) => setFormData(Object.assign(Object.assign({}, formData), { numberOfDogs: parseInt(e.target.value) }))}/>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Additional Notes</label>
                  <Textarea value={formData.notes} onChange={(e) => setFormData(Object.assign(Object.assign({}, formData), { notes: e.target.value }))} placeholder="Any special instructions or requirements..." rows={4}/>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Scheduling...' : 'Schedule Service'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>);
}
