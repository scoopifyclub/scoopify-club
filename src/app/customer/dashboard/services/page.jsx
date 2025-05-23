"use client";
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import NotificationsDropdown from '@/components/NotificationsDropdown';
import ServiceDaySelector from '@/components/ServiceDaySelector';
import ContactSupportButton from '@/components/ContactSupportButton';
import Image from 'next/image';
import { format, isAfter } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Clock, Calendar, MapPin, User, Camera, MessageSquare, ThumbsUp, Heart } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import ServiceMessageComponent from '@/components/ServiceMessageComponent';

export default function ServiceHistoryPage() {
    // Service day state
    const [serviceDay, setServiceDay] = useState('Monday'); // Default/fallback
    const [updatingDay, setUpdatingDay] = useState(false);
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('completed');
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [user, setUser] = useState(null);
    // Rating state
    const [rating, setRating] = useState(null); // 'good' | 'bad'
    const [feedback, setFeedback] = useState('');
    const [ratingSubmitted, setRatingSubmitted] = useState(false);
    const [submittingRating, setSubmittingRating] = useState(false);

    useEffect(() => {
        // Fetch user profile first
        fetch('/api/customer/profile', { credentials: 'include' })
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data) {
                    setUser(data);
                    if (data.serviceDay) setServiceDay(data.serviceDay);
                    fetchServices();
                }
            })
            .catch(err => {
                console.error('Error fetching user profile:', err);
                setError('Failed to load user profile. Please try again later.');
            });
    }, []); // Empty dependency array since this should only run once on mount

    const fetchServices = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/customer/services');
            if (!response.ok) {
                throw new Error('Failed to fetch services');
            }
            const data = await response.json();
            setServices(data);
            setError(null);
        }
        catch (err) {
            console.error('Error fetching services:', err);
            setError('Failed to load service history. Please try again later.');
        }
        finally {
            setLoading(false);
        }
    };

    const groupServicesByMonth = (serviceList) => {
        return serviceList.reduce((groups, service) => {
            const date = new Date(service.scheduledDate);
            const monthYear = format(date, 'MMMM yyyy');
            if (!groups[monthYear]) {
                groups[monthYear] = [];
            }
            groups[monthYear].push(service);
            return groups;
        }, {});
    };

    const formatAddress = (address) => {
        return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;
    };

    const getStatusBadgeClass = (status) => {
        switch (status.toUpperCase()) {
            case 'COMPLETED':
                return 'bg-green-100 text-green-800';
            case 'CANCELLED':
                return 'bg-red-100 text-red-800';
            case 'SCHEDULED':
                return 'bg-blue-100 text-blue-800';
            case 'IN_PROGRESS':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const isPhotoExpired = (photo) => {
        return photo.expiresAt && isAfter(new Date(), new Date(photo.expiresAt));
    };

    const getPhotoExpiryMessage = (photo) => {
        if (!photo.expiresAt)
            return "Photo available";
        const expiryDate = new Date(photo.expiresAt);
        const now = new Date();
        if (isAfter(now, expiryDate)) {
            return "Photo expired";
        }
        const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
        return `Available for ${daysLeft} more day${daysLeft !== 1 ? 's' : ''}`;
    };

    // --- Service Rating UI ---
    const renderRatingUI = (latestCompletedService) => {
        if (!latestCompletedService || ratingSubmitted || latestCompletedService.rated) return null;
        return (
            <div className="bg-white rounded-lg p-6 mb-8 border border-blue-100 shadow">
                <h3 className="text-lg font-semibold mb-2 text-blue-800">How was your last service?</h3>
                <div className="flex items-center mb-4 gap-4">
                    <button
                        className={`p-2 rounded-full border-2 ${rating === 'good' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
                        onClick={() => setRating('good')}
                        aria-label="Thumbs up"
                        disabled={submittingRating}
                    >
                        <span role="img" aria-label="Good">👍</span>
                    </button>
                    <button
                        className={`p-2 rounded-full border-2 ${rating === 'bad' ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                        onClick={() => setRating('bad')}
                        aria-label="Thumbs down"
                        disabled={submittingRating}
                    >
                        <span role="img" aria-label="Bad">👎</span>
                    </button>
                </div>
                {rating === 'bad' && (
                    <textarea
                        className="w-full border rounded p-2 mb-3"
                        placeholder="Please tell us what went wrong so we can make it right."
                        value={feedback}
                        onChange={e => setFeedback(e.target.value)}
                        rows={3}
                        disabled={submittingRating}
                        aria-label="Feedback"
                    />
                )}
                <button
                    className="bg-blue-600 text-white px-4 py-2 rounded font-semibold mt-2 disabled:opacity-60"
                    disabled={!rating || submittingRating}
                    onClick={async () => {
                        setSubmittingRating(true);
                        try {
                            await fetch('/api/customer/service-rating', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ serviceId: latestCompletedService.id, rating, feedback }),
                            });
                            setRatingSubmitted(true);
                            setRating(null);
                            setFeedback('');
                            // TODO: Trigger in-app notifications for admin and scooper
                            toast.success('Rating submitted!');
                        } catch (err) {
                            toast.error('Failed to submit rating. Please try again.');
                        } finally {
                            setSubmittingRating(false);
                        }
                    }}
                >
                    Submit
                </button>
                {ratingSubmitted && (
                    <div className="text-green-700 mt-2">Thank you for your feedback!</div>
                )}
            </div>
        );
    };

    const renderThankYouSection = (completedServices) => {
        if (completedServices.length === 0)
            return null;
        return (
            <div className="bg-green-50 rounded-lg p-6 mb-8 border border-green-100">
                <div className="flex items-center mb-4">
                    <Heart className="h-6 w-6 text-green-600 mr-2"/>
                    <h3 className="text-xl font-semibold text-green-800">Thank You for Your Business!</h3>
                </div>
                <p className="text-green-700 mb-3">
                    We appreciate your trust in our services. We've completed {completedServices.length} service{completedServices.length !== 1 ? 's' : ''} for you.
                </p>
                <div className="flex items-center justify-between">
                    <div className="flex items-center text-green-700">
                        <CheckCircle className="h-5 w-5 mr-1"/>
                        <span>Latest service: {format(new Date(completedServices[0].completedAt || completedServices[0].scheduledDate), 'MMMM d, yyyy')}</span>
                    </div>
                    <Button variant="outline" className="text-green-700 border-green-300 hover:bg-green-100" onClick={() => window.open('/customer/feedback', '_blank')}>
                        <ThumbsUp className="h-4 w-4 mr-2"/>
                        Share Feedback
                    </Button>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="container mx-auto py-10">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto py-10">
                <div className="bg-red-50 p-4 rounded-md">
                    <p className="text-red-800">{error}</p>
                    <Button onClick={fetchServices} className="mt-4 bg-red-600 hover:bg-red-700">
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    const completedServices = services.filter(s => s.status.toUpperCase() === 'COMPLETED');
    const upcomingServices = services.filter(s => ['SCHEDULED', 'IN_PROGRESS'].includes(s.status.toUpperCase()));
    const cancelledServices = services.filter(s => s.status.toUpperCase() === 'CANCELLED');
    const completedByMonth = groupServicesByMonth(completedServices);
    const upcomingByDate = groupServicesByMonth(upcomingServices);

    return (
        <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold">Services</h1>
                    <ServiceDaySelector
                        currentDay={serviceDay}
                        loading={updatingDay}
                        onChange={async (newDay) => {
                            if (newDay === serviceDay) return;
                            setUpdatingDay(true);
                            try {
                                const res = await fetch('/api/customer/profile', {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    credentials: 'include',
                                    body: JSON.stringify({ serviceDay: newDay })
                                });
                                if (!res.ok) throw new Error('Failed to update service day');
                                setServiceDay(newDay);
                                toast.success('Service day updated!');
                            } catch (err) {
                                toast.error('Could not update service day.');
                            } finally {
                                setUpdatingDay(false);
                            }
                        }}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <NotificationsDropdown userType="customer" />
                    <ContactSupportButton />
                </div>
            </div>

            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-8">
                    <TabsTrigger value="upcoming" className="text-sm py-2">
                        Upcoming ({upcomingServices.length})
                    </TabsTrigger>
                    <TabsTrigger value="completed" className="text-sm py-2">
                        Completed ({completedServices.length})
                    </TabsTrigger>
                    <TabsTrigger value="cancelled" className="text-sm py-2">
                        Cancelled ({cancelledServices.length})
                    </TabsTrigger>
                </TabsList>

                {/* Upcoming Services */}
                <TabsContent value="upcoming">
                    {upcomingServices.length === 0 ? (
                        <div className="text-center py-12">
                            <Calendar className="mx-auto h-12 w-12 text-gray-400"/>
                            <h3 className="mt-4 text-lg font-medium">No upcoming services</h3>
                            <p className="mt-2 text-gray-500">You don't have any scheduled services right now.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {Object.entries(upcomingByDate).map(([date, services]) => (
                                <div key={date}>
                                    <h3 className="text-xl font-semibold mb-4">{date}</h3>
                                    <div className="grid gap-4">
                                        {services.map(service => (
                                            <Card key={service.id} className="overflow-hidden">
                                                <CardHeader className="pb-2">
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center">
                                                            <Calendar className="h-5 w-5 mr-2 text-gray-500"/>
                                                            <CardTitle className="text-lg">
                                                                {format(new Date(service.scheduledDate), 'EEEE, MMMM d')}
                                                            </CardTitle>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(service.status)}`}>
                                                            {service.status}
                                                        </span>
                                                    </div>
                                                    <CardDescription>
                                                        {format(new Date(service.scheduledDate), 'h:mm a')}
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-2">
                                                        <div className="flex items-start">
                                                            <MapPin className="h-4 w-4 mr-2 text-gray-500 mt-0.5"/>
                                                            <p className="text-sm">{formatAddress(service.address)}</p>
                                                        </div>
                                                        {service.employee && (
                                                            <div className="flex items-center">
                                                                <User className="h-4 w-4 mr-2 text-gray-500"/>
                                                                <p className="text-sm">{service.employee.name}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </CardContent>
                                                <CardFooter className="pt-0 border-t">
                                                    <div className="w-full flex justify-between">
                                                        <Button variant="ghost" size="sm" className="text-green-600">
                                                            <MessageSquare className="h-4 w-4 mr-2"/>
                                                            Send Message
                                                        </Button>
                                                        <Button variant="outline" size="sm" className="text-blue-600">
                                                            <Clock className="h-4 w-4 mr-2"/>
                                                            Track Status
                                                        </Button>
                                                    </div>
                                                </CardFooter>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Completed Services */}
                <TabsContent value="completed">
                    {completedServices.length === 0 ? (
                        <div className="text-center py-12">
                            <CheckCircle className="mx-auto h-12 w-12 text-gray-400"/>
                            <h3 className="mt-4 text-lg font-medium">No completed services yet</h3>
                            <p className="mt-2 text-gray-500">Once your first service is completed, you'll see it here.</p>
                        </div>
                    ) : (
                        <div>
                            {/* Service Rating UI for latest completed service */}
                            {renderRatingUI(completedServices[0])}
                            {renderThankYouSection(completedServices)}
                            {Object.entries(completedByMonth).map(([date, monthServices]) => {
                                // Paginate completed services for this month
                                const paginatedServices = monthServices.slice((currentPage - 1) * pageSize, currentPage * pageSize);
                                const totalPages = Math.ceil(monthServices.length / pageSize);
                                return (
                                    <div key={date} className="p-6 space-y-6">
                                        <h3 className="text-xl font-semibold mb-4">{date}</h3>
                                        <div className="grid gap-6">
                                            {paginatedServices.map(service => (
                                                <Card key={service.id} className="overflow-hidden">
                                                    <CardHeader className="pb-2">
                                                        <div className="flex justify-between items-center">
                                                            <CardTitle className="text-lg">
                                                                {format(new Date(service.scheduledDate), 'EEEE, MMMM d')}
                                                            </CardTitle>
                                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(service.status)}`}>
                                                                {service.status}
                                                            </span>
                                                        </div>
                                                        <CardDescription>
                                                            Completed: {service.completedAt ? format(new Date(service.completedAt), 'MMM d, h:mm a') : 'N/A'}
                                                        </CardDescription>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="space-y-3">
                                                            <div className="flex items-start">
                                                                <MapPin className="h-4 w-4 mr-2 text-gray-500 mt-0.5"/>
                                                                <p className="text-sm">{formatAddress(service.address)}</p>
                                                            </div>
                                                            {service.employee && (
                                                                <div className="flex items-center">
                                                                    <User className="h-4 w-4 mr-2 text-gray-500"/>
                                                                    <p className="text-sm">{service.employee.name}</p>
                                                                </div>
                                                            )}
                                                            {service.notes && (
                                                                <div className="bg-gray-50 p-3 rounded-md">
                                                                    <p className="text-sm font-medium mb-1">Notes:</p>
                                                                    <p className="text-sm">{service.notes}</p>
                                                                </div>
                                                            )}
                                                            {/* Service Photos */}
                                                            {service.photos && service.photos.length > 0 && (
                                                                <div className="mt-4">
                                                                    <div className="flex items-center mb-2">
                                                                        <Camera className="h-4 w-4 mr-2 text-gray-500"/>
                                                                        <p className="text-sm font-medium">Service Photos</p>
                                                                    </div>
                                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                                        {service.photos.map(photo => !isPhotoExpired(photo) && (
                                                                            <Dialog key={photo.id}>
                                                                                <DialogTrigger asChild>
                                                                                    <button className="relative w-full h-24 sm:h-32 overflow-hidden rounded-md border border-gray-200 hover:opacity-90 transition-opacity" onClick={() => setSelectedPhoto(photo.url)}>
                                                                                        <Image src={photo.url} alt={`Service ${photo.type.toLowerCase()} photo`} fill className="object-cover"/>
                                                                                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 px-2 py-1">
                                                                                            <p className="text-xs text-white">{photo.type}</p>
                                                                                        </div>
                                                                                    </button>
                                                                                </DialogTrigger>
                                                                                <DialogContent className="max-w-3xl">
                                                                                    <div className="relative w-full h-[60vh]">
                                                                                        <Image src={photo.url} alt={`Service ${photo.type.toLowerCase()} photo`} fill className="object-contain"/>
                                                                                    </div>
                                                                                    <div className="flex justify-between items-center mt-2">
                                                                                        <p className="text-sm font-medium">{photo.type} Photo</p>
                                                                                        <p className="text-xs text-gray-500">
                                                                                            {getPhotoExpiryMessage(photo)}
                                                                                        </p>
                                                                                    </div>
                                                                                </DialogContent>
                                                                            </Dialog>
                                                                        ))}
                                                                    </div>
                                                                    {service.photos.every(photo => isPhotoExpired(photo)) && (
                                                                        <p className="text-sm text-gray-500 mt-2">
                                                                            Photos are no longer available (expired after 7 days)
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </CardContent>
                                                    <CardFooter className="pt-0 border-t">
                                                        <div className="w-full">
                                                            <ServiceMessageComponent serviceId={service.id}/>
                                                        </div>
                                                    </CardFooter>
                                                </Card>
                                            ))}
                                        </div>
                                        {/* Pagination controls */}
                                        <div className="flex justify-center items-center gap-2 mt-6">
                                            <Button
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                                aria-label="Previous page"
                                            >
                                                Prev
                                            </Button>
                                            <span className="px-2 text-gray-700">Page {currentPage} of {totalPages}</span>
                                            <Button
                                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                disabled={currentPage === totalPages}
                                                aria-label="Next page"
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                {/* Cancelled Services */}
                <TabsContent value="cancelled">
                    {cancelledServices.length === 0 ? (
                        <div className="text-center py-12">
                            <XCircle className="mx-auto h-12 w-12 text-gray-400"/>
                            <h3 className="mt-4 text-lg font-medium">No cancelled services</h3>
                            <p className="mt-2 text-gray-500">You don't have any cancelled services.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {cancelledServices.map(service => (
                                <Card key={service.id}>
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-center">
                                            <CardTitle className="text-lg">
                                                {format(new Date(service.scheduledDate), 'EEEE, MMMM d')}
                                            </CardTitle>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(service.status)}`}>
                                                {service.status}
                                            </span>
                                        </div>
                                        <CardDescription>
                                            Scheduled for: {format(new Date(service.scheduledDate), 'h:mm a')}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <div className="flex items-start">
                                                <MapPin className="h-4 w-4 mr-2 text-gray-500 mt-0.5"/>
                                                <p className="text-sm">{formatAddress(service.address)}</p>
                                            </div>
                                            {service.notes && (
                                                <div className="bg-gray-50 p-3 rounded-md mt-2">
                                                    <p className="text-sm font-medium mb-1">Cancellation Reason:</p>
                                                    <p className="text-sm">{service.notes}</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button variant="outline" className="w-full" onClick={() => window.location.href = '/customer/schedule'}>
                                            <Calendar className="h-4 w-4 mr-2"/>
                                            Reschedule Service
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

