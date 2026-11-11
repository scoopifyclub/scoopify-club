'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

function statusBadge(status) {
    const value = String(status || '').toUpperCase();
    if (value === 'IN_PROGRESS') {
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">In progress</Badge>;
    }
    if (value === 'PENDING' || value === 'SCHEDULED') {
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Claimed</Badge>;
    }
    return <Badge variant="outline">{status || 'Unknown'}</Badge>;
}

function formatAddress(job) {
    const address = job?.customer?.address;
    if (!address) return 'Address available on job details';
    return [address.street, address.city, address.state, address.zipCode].filter(Boolean).join(', ');
}

export default function MyJobsPage() {
    const router = useRouter();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadJobs = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch('/api/employee/assignments', { credentials: 'include' });
            if (!response.ok) {
                throw new Error('Failed to load your jobs');
            }
            const data = await response.json();
            setJobs(Array.isArray(data.assignments) ? data.assignments : []);
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to load jobs');
            toast.error(err.message || 'Failed to load jobs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadJobs();
    }, []);

    const openJob = (jobId) => {
        router.push(`/employee/services/${jobId}`);
    };

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">My Jobs</h1>
                    <p className="text-gray-600 mt-1">
                        Claimed jobs only. Open a job to confirm arrival, upload one cleanup photo, and complete.
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={loadJobs} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {loading && <p className="text-gray-500">Loading…</p>}
            {error && (
                <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-100 rounded-lg p-3">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                </div>
            )}

            {!loading && !error && jobs.length === 0 && (
                <Card>
                    <CardContent className="p-6 space-y-3">
                        <p className="text-gray-700">No claimed jobs right now.</p>
                        <Button onClick={() => router.push('/employee/dashboard')}>
                            Browse available jobs
                        </Button>
                    </CardContent>
                </Card>
            )}

            <div className="space-y-4">
                {jobs.map((job) => {
                    const scheduled = job.scheduledDate
                        ? new Date(job.scheduledDate).toLocaleString()
                        : 'Schedule TBD';
                    const needsArrival = !job.arrivedAt && String(job.status).toUpperCase() !== 'IN_PROGRESS';
                    return (
                        <Card key={job.id}>
                            <CardContent className="p-5">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h2 className="font-semibold text-lg">
                                                {job.customer?.user?.firstName ||
                                                    job.customer?.user?.name ||
                                                    'Customer'}
                                            </h2>
                                            {statusBadge(job.status)}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <MapPin className="h-4 w-4" />
                                            <span>{formatAddress(job)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Clock className="h-4 w-4" />
                                            <span>{scheduled}</span>
                                        </div>
                                        {job.servicePlan?.name && (
                                            <p className="text-sm text-gray-600">{job.servicePlan.name}</p>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-2 min-w-[10rem]">
                                        <Button onClick={() => openJob(job.id)}>
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            {needsArrival ? 'Start / Arrive' : 'Continue job'}
                                        </Button>
                                        <Button variant="outline" onClick={() => openJob(job.id)}>
                                            Open details
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
