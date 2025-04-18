export type ServiceStatus = 'PENDING' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DELAYED'

export type ServiceType = 'REGULAR' | 'EXTRA' | 'EMERGENCY'

export interface Service {
  id: string
  customerId: string
  employeeId?: string
  servicePlanId: string
  status: ServiceStatus
  scheduledDate: Date
  completedAt?: Date
  claimedAt?: Date
  notes?: string
  specialInstructions?: string
  createdAt: Date
  updatedAt: Date
  servicePlan?: {
    name: string
    description?: string
    price: number
    duration: number
    type: ServiceType
  }
}

export interface ServiceChecklist {
  id: string
  serviceId: string
  cornersCleaned: boolean
  wasteDisposed: boolean
  areaRaked: boolean
  gateClosed: boolean
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface ServicePhoto {
  id: string
  serviceId: string
  url: string
  type: 'BEFORE' | 'AFTER' | 'ISSUE'
  createdAt: Date
  deleteAt?: Date
}

export interface ServiceMessage {
  id: string
  serviceId: string
  employeeId: string
  message: string
  createdAt: Date
  updatedAt: Date
}

export interface ServiceDelay {
  id: string
  serviceId: string
  reason: string
  type: 'WEATHER' | 'TRAFFIC' | 'EQUIPMENT' | 'OTHER'
  reportedAt: Date
  reportedById: string
}

export interface TimeExtension {
  id: string
  serviceId: string
  employeeId: string
  minutes: number
  createdAt: Date
  updatedAt: Date
} 