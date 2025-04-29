'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Check, MapPin, Calendar, Key, Camera, ClipboardCheck } from 'lucide-react';
import { ServiceChecklist } from './ServiceChecklist';
import { ServicePhotoUpload } from './ServicePhotoUpload';

/**
 * @typedef {Object} ChecklistItem
 * @property {string} id - The unique identifier of the checklist item
 * @property {string} description - The description of the checklist item
 * @property {boolean} completed - Whether the item is completed
 */

/**
 * @typedef {Object} Checklist
 * @property {boolean} completed - Whether the checklist is completed
 * @property {ChecklistItem[]} items - Array of checklist items
 */

/**
 * @typedef {Object} Service
 * @property {string} id - The unique identifier of the service
 * @property {string} address - The service address
 * @property {string} preferredDay - The preferred day for the service
 * @property {string} [gateCode] - Optional gate code for the service
 * @property {string} [specialInstructions] - Optional special instructions
 * @property {'PENDING'|'CLAIMED'|'COMPLETED'} status - The status of the service
 * @property {string} [claimedBy] - The ID of the employee who claimed the service
 * @property {string[]} [beforePhotos] - Array of before photos
 * @property {string[]} [afterPhotos] - Array of after photos
 * @property {Checklist} [checklist] - The service checklist
 */

/**
 * @typedef {Object} EmployeeServiceCardProps
 * @property {Service} service - The service data
 * @property {string} employeeId - The ID of the employee
 * @property {Function} onClaim - Function to handle service claim
 * @property {Function} onComplete - Function to handle service completion
 */

/**
 * EmployeeServiceCard component for displaying and managing employee services
 * @param {EmployeeServiceCardProps} props - Component props
 * @returns {JSX.Element} The rendered component
 */
export function EmployeeServiceCard({
  service,
  employeeId,
  onClaim,
  onComplete,
}) {
  const [isClaiming, setIsClaiming] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);

  const handleClaim = async () => {
    try {
      setIsClaiming(true);
      await onClaim(service.id);
      toast.success('Service claimed successfully');
    } catch (error) {
      toast.error('Failed to claim service');
      console.error(error);
    } finally {
      setIsClaiming(false);
    }
  };

  const handleComplete = async (data) => {
    try {
      setIsCompleting(true);
      await onComplete(service.id, data);
      toast.success('Service completed successfully');
    } catch (error) {
      toast.error('Failed to complete service');
      console.error(error);
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">{service.address}</h3>
            <div className="mt-1 flex items-center text-sm text-neutral-600">
              <Calendar className="mr-1.5 h-4 w-4" />
              {service.preferredDay}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {service.status === 'PENDING' && (
              <Button
                onClick={handleClaim}
                disabled={isClaiming}
                className="bg-brand-primary text-white hover:bg-brand-primary-dark"
              >
                {isClaiming ? 'Claiming...' : 'Claim Service'}
              </Button>
            )}
            {service.status === 'CLAIMED' && service.claimedBy === employeeId && (
              <Button
                onClick={() => setShowChecklist(true)}
                className="bg-brand-primary text-white hover:bg-brand-primary-dark"
              >
                Complete Service
              </Button>
            )}
          </div>
        </div>

        {service.gateCode && (
          <div className="flex items-center text-sm text-neutral-600">
            <Key className="mr-1.5 h-4 w-4" />
            Gate Code: {service.gateCode}
          </div>
        )}

        {service.specialInstructions && (
          <div className="text-sm text-neutral-600">
            <p className="font-medium">Special Instructions:</p>
            <p>{service.specialInstructions}</p>
          </div>
        )}

        {service.status === 'COMPLETED' && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-400" />
              <p className="ml-2 text-sm font-medium text-green-800">Service Completed</p>
            </div>
          </div>
        )}
      </div>

      {showChecklist && (
        <div className="mt-6 space-y-4">
          <ServiceChecklist
            checklist={service.checklist}
            onComplete={(checklistData) => {
              setShowChecklist(false);
              setShowPhotoUpload(true);
            }}
          />
        </div>
      )}

      {showPhotoUpload && (
        <div className="mt-6 space-y-4">
          <ServicePhotoUpload
            serviceId={service.id}
            onComplete={(photoData) => {
              setShowPhotoUpload(false);
              handleComplete({
                checklist: service.checklist,
                photos: photoData,
              });
            }}
          />
        </div>
      )}
    </div>
  );
}
