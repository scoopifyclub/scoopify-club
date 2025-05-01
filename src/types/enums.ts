export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  EMPLOYEE = 'EMPLOYEE',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER'
}

export enum ServiceStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum JobStatus {
  AVAILABLE = 'AVAILABLE',
  CLAIMED = 'CLAIMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum ServiceWindow {
  MORNING = 'Morning',
  AFTERNOON = 'Afternoon'
}
