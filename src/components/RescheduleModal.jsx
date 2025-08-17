'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { format, addDays, subDays, isBefore, isAfter } from 'date-fns';

export default function RescheduleModal({ 
    isOpen, 
    onClose, 
    service, 
    onReschedule 
}) {
    const [selectedDate, setSelectedDate] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    if (!service) return null;

    const originalDate = new Date(service.scheduledDate);
    
    // Calculate the date range (±3 days)
    const minDate = subDays(originalDate, 3);
    const maxDate = addDays(originalDate, 3);
    
    // Filter out past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const handleReschedule = async () => {
        if (!selectedDate) {
            toast.error('Please select a new date');
            return;
        }

        if (isBefore(selectedDate, today)) {
            toast.error('Cannot reschedule to a past date');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`/api/customer/services/${service.id}/reschedule`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    newDate: selectedDate.toISOString()
                })
            });

            if (response.ok) {
                const data = await response.json();
                toast.success('Service rescheduled successfully!');
                onReschedule(data.service);
                onClose();
            } else {
                const error = await response.json();
                toast.error(error.error || 'Failed to reschedule service');
            }
        } catch (error) {
            console.error('Error rescheduling service:', error);
            toast.error('Failed to reschedule service');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDateSelect = (date) => {
        if (date) {
            setSelectedDate(date);
        }
    };

    const getDateRangeInfo = () => {
        const daysDiff = selectedDate 
            ? Math.ceil((selectedDate.getTime() - originalDate.getTime()) / (1000 * 3600 * 24))
            : 0;

        if (daysDiff === 0) return { text: 'Same day', color: 'text-gray-600' };
        if (daysDiff > 0) return { text: `${daysDiff} day${daysDiff > 1 ? 's' : ''} later`, color: 'text-blue-600' };
        return { text: `${Math.abs(daysDiff)} day${Math.abs(daysDiff) > 1 ? 's' : ''} earlier`, color: 'text-green-600' };
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>Reschedule Service</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="h-8 w-8 p-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Current Service Info */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium text-gray-900 mb-2">Current Schedule</h3>
                        <div className="text-sm text-gray-600">
                            <p><strong>Date:</strong> {format(originalDate, 'EEEE, MMMM d, yyyy')}</p>
                            <p><strong>Time:</strong> {format(originalDate, 'h:mm a')}</p>
                            <p><strong>Service:</strong> {service.servicePlan?.name || 'Standard Service'}</p>
                        </div>
                    </div>

                    {/* Date Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700">
                            Select New Date (±3 days from original)
                        </label>
                        
                        <div className="border rounded-lg p-3">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={handleDateSelect}
                                disabled={(date) => {
                                    // Disable dates outside ±3 day range
                                    return isBefore(date, minDate) || 
                                           isAfter(date, maxDate) ||
                                           isBefore(date, today);
                                }}
                                className="rounded-md"
                            />
                        </div>

                        {/* Date Range Info */}
                        {selectedDate && (
                            <div className="text-center p-3 bg-blue-50 rounded-lg">
                                <p className="text-sm text-gray-600">
                                    <span className="font-medium">New Date:</span> {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                                </p>
                                <p className={`text-sm font-medium ${getDateRangeInfo().color}`}>
                                    {getDateRangeInfo().text}
                                </p>
                            </div>
                        )}

                        {/* Date Range Limits */}
                        <div className="text-xs text-gray-500 text-center">
                            <p>Available range: {format(minDate, 'MMM d')} - {format(maxDate, 'MMM d')}</p>
                            <p>Cannot reschedule to past dates</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="flex-1"
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleReschedule}
                            disabled={!selectedDate || isLoading}
                            className="flex-1"
                        >
                            {isLoading ? 'Rescheduling...' : 'Reschedule Service'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
