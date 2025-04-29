'use client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, User, X } from 'lucide-react';
export function ServiceDetails({ service, onClose, onClaim, onArrive, onComplete, hasInProgressJob = false }) {
    var _a;
    if (!service)
        return null;
    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString([], {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };
    const formatDuration = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };
    return (<Dialog open={!!service} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{((_a = service.servicePlan) === null || _a === void 0 ? void 0 : _a.name) || 'Service Details'}</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4"/>
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Service Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-500"/>
              <div>
                <div className="font-medium">{formatDate(service.scheduledDate)}</div>
                <div className="text-sm text-gray-500">
                  {formatTime(service.scheduledDate)}
                </div>
              </div>
            </div>

            {service.servicePlan && (<div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-gray-500"/>
                <div>
                  <div className="font-medium">Duration</div>
                  <div className="text-sm text-gray-500">
                    {formatDuration(service.servicePlan.duration)}
                  </div>
                </div>
              </div>)}
          </div>

          {/* Customer Info */}
          <div className="space-y-4">
            <h3 className="font-medium">Customer Information</h3>
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-gray-500"/>
              <div className="text-sm">{service.customer.email}</div>
            </div>
            {service.customer.address && (<div className="flex items-start space-x-2">
                <MapPin className="h-5 w-5 text-gray-500 mt-0.5"/>
                <div className="text-sm">
                  <div>{service.customer.address.street}</div>
                  <div>
                    {service.customer.address.city}, {service.customer.address.state} {service.customer.address.zipCode}
                  </div>
                </div>
              </div>)}
          </div>

          {/* Notes */}
          {service.notes && (<div className="space-y-2">
              <h3 className="font-medium">Notes</h3>
              <p className="text-sm text-gray-600">{service.notes}</p>
            </div>)}

          {/* Actions */}
          <div className="flex space-x-2 pt-4">
            {service.status === 'SCHEDULED' && onClaim && (<Button onClick={onClaim} className="flex-1" disabled={hasInProgressJob}>
                {hasInProgressJob ? 'Complete Current Job First' : 'Claim Job'}
              </Button>)}
            {service.status === 'CLAIMED' && onArrive && (<Button onClick={onArrive} className="flex-1">
                Mark as Arrived
              </Button>)}
            {service.status === 'ARRIVED' && onComplete && (<Button onClick={onComplete} className="flex-1">
                Complete Service
              </Button>)}
          </div>

          {service.status === 'SCHEDULED' && hasInProgressJob && (<div className="p-3 bg-yellow-50 text-yellow-700 rounded-md text-sm">
              You must complete your current job before claiming a new one.
            </div>)}
        </div>
      </DialogContent>
    </Dialog>);
}
