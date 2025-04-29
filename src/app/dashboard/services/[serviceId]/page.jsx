'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { StarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
export default function ServiceDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const serviceId = params.serviceId;
    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [feedback, setFeedback] = useState({ rating: 0, comment: '' });
    const [submittingFeedback, setSubmittingFeedback] = useState(false);
    useEffect(() => {
        fetchServiceDetails();
    }, []);
    const fetchServiceDetails = async () => {
        try {
            const response = await fetch(`/api/customer/services/${serviceId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });
            if (!response.ok) {
                throw new Error('Failed to fetch service details');
            }
            const data = await response.json();
            setService(data);
            if (data.feedback) {
                setFeedback(data.feedback);
            }
        }
        catch (err) {
            setError('Failed to load service details');
            console.error('Error fetching service details:', err);
        }
        finally {
            setLoading(false);
        }
    };
    const handleSubmitFeedback = async () => {
        if (feedback.rating === 0) {
            toast.error('Please select a rating');
            return;
        }
        setSubmittingFeedback(true);
        try {
            const response = await fetch(`/api/customer/services/${serviceId}/feedback`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(feedback),
            });
            if (!response.ok) {
                throw new Error('Failed to submit feedback');
            }
            toast.success('Feedback submitted successfully');
            fetchServiceDetails();
        }
        catch (err) {
            toast.error('Failed to submit feedback');
            console.error('Error submitting feedback:', err);
        }
        finally {
            setSubmittingFeedback(false);
        }
    };
    if (loading) {
        return (<div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>);
    }
    if (!service) {
        return (<div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Service not found
        </div>
      </div>);
    }
    return (<div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Service Details</h1>
        <Button variant="outline" onClick={() => router.back()}>
          Back to Services
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Service Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-gray-500">Date & Time</div>
              <div>{format(new Date(service.scheduledFor), 'PPP p')}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Status</div>
              <Badge className={service.status === 'COMPLETED'
            ? 'bg-green-100 text-green-800'
            : service.status === 'IN_PROGRESS'
                ? 'bg-yellow-100 text-yellow-800'
                : service.status === 'CANCELLED'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-blue-100 text-blue-800'}>
                {service.status}
              </Badge>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Service Type</div>
              <div className="capitalize">{service.type}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Number of Dogs</div>
              <div>{service.numberOfDogs}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Employee</div>
              <div>{service.employee.name}</div>
              <div className="text-sm text-gray-500">{service.employee.phone}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Location</div>
              <div>{service.address.street}</div>
              <div className="text-sm text-gray-500">
                {service.address.city}, {service.address.state} {service.address.zipCode}
              </div>
            </div>
          </CardContent>
        </Card>

        {service.status === 'COMPLETED' && (<Card>
            <CardHeader>
              <CardTitle>Service Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {service.checklist.map((item) => (<li key={item.id} className="flex items-center">
                    <input type="checkbox" checked={item.completed} readOnly className="mr-2"/>
                    <span>{item.item}</span>
                  </li>))}
              </ul>
            </CardContent>
          </Card>)}
      </div>

      {service.status === 'COMPLETED' && (<>
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Service Photos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Before</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {service.photos
                .filter((photo) => photo.type === 'BEFORE')
                .map((photo) => (<div key={photo.id} className="relative aspect-square">
                          <Image src={photo.url} alt="Before service" fill className="object-cover rounded-lg"/>
                        </div>))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>After</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {service.photos
                .filter((photo) => photo.type === 'AFTER')
                .map((photo) => (<div key={photo.id} className="relative aspect-square">
                          <Image src={photo.url} alt="After service" fill className="object-cover rounded-lg"/>
                        </div>))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Feedback</CardTitle>
              <CardDescription>
                {service.feedback
                ? 'Your feedback has been recorded'
                : 'How was your service? Leave your feedback below'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {service.feedback ? (<div className="space-y-4">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (<StarIcon key={star} className={`w-6 h-6 ${star <= service.feedback.rating
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'}`}/>))}
                  </div>
                  <p className="text-gray-700">{service.feedback.comment}</p>
                  <p className="text-sm text-gray-500">
                    Submitted on {format(new Date(service.feedback.createdAt), 'PPP')}
                  </p>
                </div>) : (<div className="space-y-4">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (<button key={star} onClick={() => setFeedback(Object.assign(Object.assign({}, feedback), { rating: star }))} className="focus:outline-none">
                        <StarIcon className={`w-6 h-6 ${star <= feedback.rating
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'}`}/>
                      </button>))}
                  </div>
                  <Textarea placeholder="Share your experience..." value={feedback.comment} onChange={(e) => setFeedback(Object.assign(Object.assign({}, feedback), { comment: e.target.value }))} rows={4}/>
                  <Button onClick={handleSubmitFeedback} disabled={submittingFeedback}>
                    {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                  </Button>
                </div>)}
            </CardContent>
          </Card>
        </>)}
    </div>);
}
