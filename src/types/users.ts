import { Role } from './auth'

export interface Address {
  id: string
  street: string
  city: string
  state: string
  zipCode: string
  customerId: string
  createdAt: Date
  updatedAt: Date
}

export interface Subscription {
  id: string
  customerId: string
  plan: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED'
  startDate: Date
  endDate?: Date
  createdAt: Date
  updatedAt: Date
}

export interface Payment {
  id: string
  amount: number
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
  method: 'CARD' | 'BANK' | 'CASH'
  date?: Date
  subscriptionId?: string
  serviceId?: string
  employeeId?: string
  createdAt: Date
  updatedAt: Date
}

export interface ServiceArea {
  id: string
  employeeId: string
  zipCode: string
  createdAt: Date
  updatedAt: Date
}

export interface UserProfile {
  id: string
  email: string
  name?: string
  role: Role
  image?: string
  createdAt: Date
  updatedAt: Date
}

export interface CustomerProfile extends UserProfile {
  customer: {
    id: string
    name: string
    email: string
    phone?: string
    status: 'ACTIVE' | 'INACTIVE'
    address?: Address
    subscriptions: Subscription[]
    services: Array<{
      id: string
      scheduledDate: Date
      status: string
      paymentAmount: number
    }>
  }
}

export interface EmployeeProfile extends UserProfile {
  employee: {
    id: string
    name: string
    email: string
    phone?: string
    status: 'ACTIVE' | 'INACTIVE'
    serviceAreas: ServiceArea[]
    services: Array<{
      id: string
      scheduledDate: Date
      status: string
      paymentAmount: number
    }>
  }
} 