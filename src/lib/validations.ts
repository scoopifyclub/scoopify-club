import { Service, ServiceStatus } from '@prisma/client';

export function checkTimeConflict(
  services: Service[],
  newService: Service,
  currentUserId: string
): boolean {
  // Get all services assigned to the current user
  const userServices = services.filter(
    service => service.employeeId === currentUserId
  );

  // For now, we're just checking if the user has any in-progress services
  // This is a basic check since we don't have explicit time slots
  const hasInProgressService = userServices.some(
    service => ['CLAIMED', 'ARRIVED', 'IN_PROGRESS'].includes(service.status)
  );

  return hasInProgressService;
}

export function validateEmployeeAccess(
  service: Service,
  currentUserId: string,
  isAdmin: boolean = false
): boolean {
  // Admin can access any service
  if (isAdmin) return true;

  // Check if the current user is the assigned employee
  return service.employeeId === currentUserId;
}

export function validateServiceCompletion(
  service: Service,
  currentUserId: string,
  isAdmin: boolean = false
): { isValid: boolean; error?: string } {
  // Check employee access
  if (!validateEmployeeAccess(service, currentUserId, isAdmin)) {
    return {
      isValid: false,
      error: 'You are not authorized to complete this service'
    };
  }

  // Check if service is in a valid state for completion
  if (!['ARRIVED', 'IN_PROGRESS'].includes(service.status)) {
    return {
      isValid: false,
      error: 'Service must be marked as arrived before completion'
    };
  }

  return { isValid: true };
}

export function validatePhotoUpload(
  service: Service,
  currentUserId: string,
  isAdmin: boolean = false
): { isValid: boolean; error?: string } {
  // Check employee access
  if (!validateEmployeeAccess(service, currentUserId, isAdmin)) {
    return {
      isValid: false,
      error: 'You are not authorized to upload photos for this service'
    };
  }

  // Check if service is in a valid state for photo upload
  if (!['ARRIVED', 'IN_PROGRESS', 'COMPLETED'].includes(service.status)) {
    return {
      isValid: false,
      error: 'Service must be in progress or completed to upload photos'
    };
  }

  return { isValid: true };
}

export const validateStatusTransition = (
  currentStatus: ServiceStatus,
  newStatus: ServiceStatus
): { isValid: boolean; error?: string } => {
  const validTransitions: Record<ServiceStatus, ServiceStatus[]> = {
    PENDING: ['SCHEDULED', 'CANCELLED'],
    SCHEDULED: ['CLAIMED', 'CANCELLED', 'EXPIRED'],
    CLAIMED: ['ARRIVED', 'CANCELLED'],
    ARRIVED: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: [],
    EXPIRED: []
  };

  if (!validTransitions[currentStatus].includes(newStatus)) {
    return {
      isValid: false,
      error: `Invalid status transition from ${currentStatus} to ${newStatus}`
    };
  }

  return { isValid: true };
};

export const validateServiceStatus = (
  service: Service,
  newStatus: ServiceStatus,
  userId: string,
  isAdmin: boolean
): { isValid: boolean; error?: string } => {
  // Check if user has permission to change status
  if (!isAdmin && service.employeeId !== userId) {
    return {
      isValid: false,
      error: 'Only the assigned employee or admin can change service status'
    };
  }

  // Validate status transition
  const transitionValidation = validateStatusTransition(service.status, newStatus);
  if (!transitionValidation.isValid) {
    return transitionValidation;
  }

  // Additional status-specific validations
  switch (newStatus) {
    case 'COMPLETED':
      if (service.status !== 'IN_PROGRESS') {
        return {
          isValid: false,
          error: 'Service must be in progress before it can be completed'
        };
      }
      break;
    case 'ARRIVED':
      if (service.status !== 'CLAIMED') {
        return {
          isValid: false,
          error: 'Service must be claimed before arrival can be recorded'
        };
      }
      break;
    case 'IN_PROGRESS':
      if (service.status !== 'ARRIVED') {
        return {
          isValid: false,
          error: 'Employee must arrive before starting service'
        };
      }
      break;
  }

  return { isValid: true };
}; 