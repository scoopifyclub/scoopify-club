import { ServiceWindow } from './enums';

export interface JobPoolEntry {
  id: string;
  serviceId: string;
  openedAt: Date;
  claimedAt?: Date;
  claimerId?: string;
  status: JobStatus;
  service: {
    id: string;
    customerId: string;
    address: string;
    preferredDay: string;
    serviceWindow: ServiceWindow;
    scheduledAt: Date;
    customer: {
      name: string;
      phone: string;
    };
    serviceArea: {
      id: string;
      zipCode: string;
      travelRange: number;
    };
  };
}

export enum JobStatus {
  AVAILABLE = 'AVAILABLE',
  CLAIMED = 'CLAIMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}
