'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Check, MapPin, Calendar, Key, Camera, ClipboardCheck } from 'lucide-react'
import { ServiceChecklist } from './ServiceChecklist'
import { ServicePhotoUpload } from './ServicePhotoUpload'

interface Service {
  id: string
  address: string
  preferredDay: string
  gateCode?: string
  specialInstructions?: string
  status: 'PENDING' | 'CLAIMED' | 'COMPLETED'
  claimedBy?: string
  beforePhotos?: string[]
  afterPhotos?: string[]
  checklist?: {
    completed: boolean
    items: {
      id: string
      description: string
      completed: boolean
    }[]
  }
}

interface EmployeeServiceCardProps {
  service: Service
  employeeId: string
  onClaim: (serviceId: string) => Promise<void>
  onComplete: (serviceId: string, data: any) => Promise<void>
}

export function EmployeeServiceCard({
  service,
  employeeId,
  onClaim,
  onComplete,
}: EmployeeServiceCardProps) {
  const [isClaiming, setIsClaiming] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [showChecklist, setShowChecklist] = useState(false)
  const [showPhotoUpload, setShowPhotoUpload] = useState(false)

  const handleClaim = async () => {
    try {
      setIsClaiming(true)
      await onClaim(service.id)
      toast.success('Service claimed successfully')
    } catch (error) {
      toast.error('Failed to claim service')
      console.error(error)
    } finally {
      setIsClaiming(false)
    }
  }

  const handleComplete = async (data: any) => {
    try {
      setIsCompleting(true)
      await onComplete(service.id, data)
      toast.success('Service completed successfully')
    } catch (error) {
      toast.error('Failed to complete service')
      console.error(error)
    } finally {
      setIsCompleting(false)
    }
  }

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
              setShowChecklist(false)
              setShowPhotoUpload(true)
            }}
          />
        </div>
      )}

      {showPhotoUpload && (
        <div className="mt-6 space-y-4">
          <ServicePhotoUpload
            serviceId={service.id}
            onComplete={(photoData) => {
              setShowPhotoUpload(false)
              handleComplete({
                checklist: service.checklist,
                photos: photoData,
              })
            }}
          />
        </div>
      )}
    </div>
  )
} 