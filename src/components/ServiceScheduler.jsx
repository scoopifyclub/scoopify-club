'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

/**
 * ServiceScheduler component for scheduling services
 * @returns {JSX.Element} The rendered component
 */
export function ServiceScheduler() {
    const [date, setDate] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSchedule = async () => {
        if (!date) return;

        try {
            setLoading(true);
            const response = await fetch('/api/services/schedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    date: date.toISOString(),
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to schedule service');
            }

            const data = await response.json();
            toast.success('Service scheduled successfully!');
            router.push('/dashboard');
        } catch (error) {
            console.error('Error scheduling service:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to schedule service');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <h3 className="text-lg font-medium">Schedule Service</h3>
                <p className="text-sm text-neutral-600">
                    Select a date for your next service
                </p>
            </div>

            <div className="rounded-md border p-4">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border"
                    disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today;
                    }}
                />
            </div>

            <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-neutral-500" />
                <span className="text-sm text-neutral-600">
                    {date ? format(date, 'PPP') : 'No date selected'}
                </span>
            </div>

            <Button
                className="w-full"
                onClick={handleSchedule}
                disabled={!date || loading}
            >
                {loading ? 'Scheduling...' : 'Schedule Service'}
            </Button>
        </div>
    );
}
