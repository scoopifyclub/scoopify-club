'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CustomerDashboardLayout } from '@/components/layouts/CustomerDashboardLayout';
import ServiceRatingModal from '@/components/customer/ServiceRatingModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Clock, MapPin, User, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ServiceRatingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const serviceId = searchParams.get('serviceId');
    
    const [service, setService] = useState(null);
    const [scooper, setScooper] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [hasRated, setHasRated] = useState(false);

    useEffect(() => {
        if (serviceId) {
            fetchServiceDetails();
        }
    }, [serviceId]);

    const fetchServiceDetails = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/customer/services/${serviceId}`);
            
            if (!response.ok) {
                throw new Error('Service not found');
            }

            const data = await response.json();
            setService(data.service);
            setScooper(data.service.employee);

            // Check if already rated
            const ratingResponse = await fetch(`/api/customer/services/rating?serviceId=${serviceId}`);
            if (ratingResponse.ok) {
                const ratingData = await ratingResponse.json();
                if (ratingData.rating) {
                    setHasRated(true);
                }
            }

        } catch (error) {
            console.error('Error fetching service details:', error);
            setError('Failed to load service details');
        } finally {
            setLoading(false);
        }
    };

    const handleRatingSubmitted = (rating) => {
        setHasRated(true);
        toast.success('Thank you for your feedback!');
        
        // Redirect to services page after a short delay
        setTimeout(() => {
            router.push('/dashboard/services');
        }, 2000);
    };

    if (loading) {
        return (
            <CustomerDashboardLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            </CustomerDashboardLayout>
        );
    }

    if (error || !service) {
        return (
            <CustomerDashboardLayout>
                <div className="max-w-2xl mx-auto p-6">
                    <Card>
                        <CardContent className="p-6 text-center">
                            <div className="text-red-500 mb-4">
                                <CheckCircle className="w-16 h-16 mx-auto" />
                            </div>
                            <h2 className="text-xl font-semibold mb-2">Service Not Found</h2>
                            <p className="text-gray-600 mb-4">
                                {error || 'The service you\'re looking for could not be found.'}
                            </p>
                            <Button onClick={() => router.push('/dashboard/services')}>
                                Back to Services
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </CustomerDashboardLayout>
        );
    }

    if (hasRated) {
        return (
            <CustomerDashboardLayout>
                <div className="max-w-2xl mx-auto p-6">
                    <Card>
                        <CardContent className="p-6 text-center">
                            <div className="text-green-500 mb-4">
                                <Star className="w-16 h-16 mx-auto" />
                            </div>
                            <h2 className="text-xl font-semibold mb-2">Already Rated!</h2>
                            <p className="text-gray-600 mb-4">
                                You have already rated this service. Thank you for your feedback!
                            </p>
                            <Button onClick={() => router.push('/dashboard/services')}>
                                Back to Services
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </CustomerDashboardLayout>
        );
    }

    return (
        <CustomerDashboardLayout>
            <div className="max-w-4xl mx-auto p-6">
                <div className="mb-6">
                    <Button 
                        variant="outline" 
                        onClick={() => router.push('/dashboard/services')}
                        className="mb-4"
                    >
                        ← Back to Services
                    </Button>
                    
                    <h1 className="text-3xl font-bold">Rate Your Service</h1>
                    <p className="text-gray-600 mt-2">
                        Help us improve and help other customers choose great scoopers!
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Service Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                                Service Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center space-x-3">
                                <User className="w-5 h-5 text-gray-500" />
                                <div>
                                    <p className="font-medium">{scooper?.user?.name || 'Scooper Name'}</p>
                                    <p className="text-sm text-gray-600">Your assigned scooper</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                                <MapPin className="w-5 h-5 text-gray-500" />
                                <div>
                                    <p className="font-medium">{service.servicePlan?.name || 'Service Type'}</p>
                                    <p className="text-sm text-gray-600">Service plan</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                                <Clock className="w-5 h-5 text-gray-500" />
                                <div>
                                    <p className="font-medium">
                                        {new Date(service.completedDate).toLocaleDateString()}
                                    </p>
                                    <p className="text-sm text-gray-600">Completion date</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t">
                                <Badge variant="secondary" className="text-sm">
                                    Service #{service.id.slice(-8)}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Rating Prompt */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Star className="w-5 h-5 mr-2 text-yellow-500" />
                                Rate Your Experience
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-gray-600">
                                How was your service with <strong>{scooper?.user?.name}</strong>? 
                                Your feedback helps us improve and helps other customers choose great scoopers.
                            </p>
                            
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h4 className="font-medium text-blue-800 mb-2">What makes a great rating?</h4>
                                <ul className="text-sm text-blue-700 space-y-1">
                                    <li>• Professional and courteous service</li>
                                    <li>• Thorough cleanup of your yard</li>
                                    <li>• On-time arrival and completion</li>
                                    <li>• Good communication throughout</li>
                                </ul>
                            </div>

                            <Button 
                                onClick={() => setShowRatingModal(true)}
                                className="w-full bg-blue-600 hover:bg-blue-700"
                                size="lg"
                            >
                                <Star className="w-5 h-5 mr-2" />
                                Rate This Service
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Rating Modal */}
                {showRatingModal && service && scooper && (
                    <ServiceRatingModal
                        isOpen={showRatingModal}
                        onClose={() => setShowRatingModal(false)}
                        service={service}
                        scooper={scooper}
                        onRatingSubmitted={handleRatingSubmitted}
                    />
                )}
            </div>
        </CustomerDashboardLayout>
    );
}
