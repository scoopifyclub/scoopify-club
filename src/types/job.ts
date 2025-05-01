export enum JobStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface Job {
  id: string;
  customerId: string;
  employeeId?: string;
  address: string;
  zipCode: string;
  scheduledAt: string;
  status: JobStatus;
  price: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
