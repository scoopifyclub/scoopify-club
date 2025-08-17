'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, formatDistanceToNow } from 'date-fns';
import { 
    Clock, 
    MapPin, 
    User, 
    CheckCircle, 
    AlertCircle, 
    Camera,
    Heart,
    MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';
import MessagingInterface from '@/components/customer/MessagingInterface';

export default function ServiceTrackingCard({ service, onUpdate }) {
    const [isLoading, setIsLoading] = useState(false);
    const [showTipModal, setShowTipModal] = useState(false);
    const [showMessaging, setShowMessaging] = useState(false);

    const getStatusColor = (status) => {
        switch (status) {
            case 'SCHEDULED':
                return 'bg-blue-100 text-blue-800';
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800';
            case 'IN_PROGRESS':
                return 'bg-orange-100 text-orange-800';
            case 'COMPLETED':
                return 'bg-green-100 text-green-800';
            case 'CANCELLED':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'SCHEDULED':
                return <Clock className="w-4 h-4" />;
            case 'PENDING':
                return <AlertCircle className="w-4 h-4" />;
            case 'IN_PROGRESS':
                return <User className="w-4 h-4" />;
            case 'COMPLETED':
                return <CheckCircle className="w-4 h-4" />;
            default:
                return <Clock className="w-4 h-4" />;
        }
    };

    const getStatusMessage = (status) => {
        switch (status) {
            case 'SCHEDULED':
                return 'Waiting for a scooper to claim your service';
            case 'PENDING':
                return 'A scooper has claimed your service and will arrive soon';
            case 'IN_PROGRESS':
                return 'Your scooper is currently working on your yard';
            case 'COMPLETED':
                return 'Service completed successfully!';
            default:
                return 'Service status unknown';
        }
    };

    const handleTipService = () => {
        setShowTipModal(true);
    };

    const renderScooperInfo = () => {
        if (!service.employee) {
            return (
                <div className="text-center py-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-2 flex items-center justify-center">
                        <User className="w-8 h-8 text-gray-500" />
                    </div>
                    <p className="text-gray-600">Waiting for scooper assignment</p>
                </div>
            );
        }

        return (
            <div className="flex items-center space-x-3">
                <Avatar className="w-12 h-12">
                    <AvatarImage src={service.employee.user?.image} alt={service.employee.user?.name} />
                    <AvatarFallback>
                        {service.employee.user?.name?.charAt(0) || 'S'}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-medium">{service.employee.user?.name}</p>
                    <p className="text-sm text-gray-600">
                        {service.employee.phone || 'Phone not available'}
                    </p>
                    {service.employee.averageRating && (
                        <div className="flex items-center mt-1">
                            <span className="text-yellow-500">⭐</span>
                            <span className="text-sm text-gray-600 ml-1">
                                {service.employee.averageRating.toFixed(1)} ({service.employee.completedJobs || 0} jobs)
                            </span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderServicePhotos = () => {
        if (!service.beforePhotoIds && !service.afterPhotoIds) {
            return null;
        }

        return (
            <div className="mt-4">
                <h4 className="font-medium mb-2 flex items-center">
                    <Camera className="w-4 h-4 mr-2" />
                    Service Photos
                </h4>
                <div className="grid grid-cols-2 gap-4">
                    {service.beforePhotoIds && service.beforePhotoIds.length > 0 && (
                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Before Photos</p>
                            <div className="grid grid-cols-2 gap-2">
                                {service.beforePhotoIds.slice(0, 4).map((photoUrl, index) => (
                                    <div key={index} className="relative">
                                        <img
                                            src={photoUrl}
                                            alt={`Before photo ${index + 1}`}
                                            className="w-full h-20 object-cover rounded-lg border"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'block';
                                            }}
                                        />
                                        <div className="hidden w-full h-20 bg-gray-100 rounded-lg border flex items-center justify-center">
                                            <span className="text-xs text-gray-500">Photo {index + 1}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {service.afterPhotoIds && service.afterPhotoIds.length > 0 && (
                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">After Photos</p>
                            <div className="grid grid-cols-2 gap-2">
                                {service.afterPhotoIds.slice(0, 4).map((photoUrl, index) => (
                                    <div key={index} className="relative">
                                        <img
                                            src={photoUrl}
                                            alt={`After photo ${index + 1}`}
                                            className="w-full h-20 object-cover rounded-lg border"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'block';
                                            }}
                                        />
                                        <div className="hidden w-full h-20 bg-gray-100 rounded-lg border flex items-center justify-center">
                                            <span className="text-xs text-gray-500">Photo {index + 1}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    Photos are stored for 1 week for space management
                </p>
            </div>
        );
    };

    const renderTipSection = () => {
        if (service.status !== 'COMPLETED' || !service.employee) {
            return null;
        }

        return (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                    <Heart className="w-4 h-4 mr-2" />
                    Show Your Appreciation
                </h4>
                <p className="text-sm text-blue-700 mb-3">
                    If you're happy with the service, consider leaving a tip for {service.employee.user?.name}!
                </p>
                <Button 
                    onClick={handleTipService}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                >
                    Leave a Tip
                </Button>
            </div>
        );
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                        {getStatusIcon(service.status)}
                        <span className="ml-2">Service #{service.id.slice(-8)}</span>
                    </CardTitle>
                    <Badge className={getStatusColor(service.status)}>
                        {service.status}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Status Message */}
                <div className="text-center py-2">
                    <p className="text-gray-700">{getStatusMessage(service.status)}</p>
                </div>

                {/* Service Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-gray-600">Service Type</p>
                        <p className="font-medium">{service.servicePlan?.name || 'Standard Service'}</p>
                    </div>
                    <div>
                        <p className="text-gray-600">Scheduled</p>
                        <p className="font-medium">
                            {format(new Date(service.scheduledDate), 'MMM d, h:mm a')}
                        </p>
                    </div>
                    {service.arrivedAt && (
                        <div>
                            <p className="text-gray-600">Arrived</p>
                            <p className="font-medium">
                                {format(new Date(service.arrivedAt), 'h:mm a')}
                            </p>
                        </div>
                    )}
                    {service.completedDate && (
                        <div>
                            <p className="text-gray-600">Completed</p>
                            <p className="font-medium">
                                {format(new Date(service.completedDate), 'h:mm a')}
                            </p>
                        </div>
                    )}
                </div>

                {/* Scooper Information */}
                <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium flex items-center">
                            <User className="w-4 h-4 mr-2" />
                            Scooper
                        </h4>
                        {service.employee && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowMessaging(!showMessaging)}
                                className="flex items-center gap-2"
                            >
                                <MessageCircle className="w-4 h-4" />
                                {showMessaging ? 'Close Chat' : 'Message'}
                            </Button>
                        )}
                    </div>
                    {renderScooperInfo()}
                    
                    {/* Messaging Interface */}
                    {showMessaging && service.employee && (
                        <div className="mt-4">
                            <MessagingInterface 
                                service={service} 
                                scooper={service.employee} 
                            />
                        </div>
                    )}
                </div>

                {/* Service Photos */}
                {renderServicePhotos()}

                {/* Tip Section */}
                {renderTipSection()}

                {/* Notes */}
                {service.notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-2 flex items-center">
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Notes
                        </h4>
                        <p className="text-sm text-gray-700">{service.notes}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
