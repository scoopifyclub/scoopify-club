import { prisma } from '@/lib/prisma';

/**
 * Create a notification for an employee
 */
export async function createNotification(userId, type, title, message, metadata = {}) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        metadata,
        read: false
      }
    });

    console.log(`Notification created for user ${userId}: ${title}`);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Create notification for new job available
 */
export async function notifyNewJobAvailable(employeeId, serviceId) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        User: true
      }
    });

    if (!employee) return;

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        customer: {
          include: {
            User: true,
            address: true
          }
        }
      }
    });

    if (!service) return;

    await createNotification(
      employee.userId,
      'NEW_JOB',
      'New Job Available',
      `New service available for ${service.customer.User?.name || 'Customer'} in ${service.customer.address?.city || 'your area'}`,
      {
        serviceId,
        customerName: service.customer.User?.name,
        address: service.customer.address,
        potentialEarnings: service.potentialEarnings
      }
    );
  } catch (error) {
    console.error('Error creating new job notification:', error);
  }
}

/**
 * Create notification for service status update
 */
export async function notifyServiceStatusUpdate(employeeId, serviceId, status) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        User: true
      }
    });

    if (!employee) return;

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        customer: {
          include: {
            User: true
          }
        }
      }
    });

    if (!service) return;

    let title, message;
    switch (status) {
      case 'COMPLETED':
        title = 'Service Completed';
        message = `Service for ${service.customer.User?.name || 'Customer'} has been completed successfully`;
        break;
      case 'CANCELLED':
        title = 'Service Cancelled';
        message = `Service for ${service.customer.User?.name || 'Customer'} has been cancelled`;
        break;
      case 'IN_PROGRESS':
        title = 'Service Started';
        message = `Service for ${service.customer.User?.name || 'Customer'} is now in progress`;
        break;
      default:
        title = 'Service Update';
        message = `Service status updated to ${status}`;
    }

    await createNotification(
      employee.userId,
      'SERVICE_UPDATE',
      title,
      message,
      {
        serviceId,
        status,
        customerName: service.customer.User?.name
      }
    );
  } catch (error) {
    console.error('Error creating service status notification:', error);
  }
}

/**
 * Create notification for payment received
 */
export async function notifyPaymentReceived(employeeId, amount, serviceId) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        User: true
      }
    });

    if (!employee) return;

    await createNotification(
      employee.userId,
      'PAYMENT',
      'Payment Received',
      `You received a payment of $${amount.toFixed(2)} for your service`,
      {
        amount,
        serviceId
      }
    );
  } catch (error) {
    console.error('Error creating payment notification:', error);
  }
}

/**
 * Create notification for onboarding reminder
 */
export async function notifyOnboardingReminder(employeeId) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        User: true
      }
    });

    if (!employee) return;

    await createNotification(
      employee.userId,
      'ONBOARDING_REMINDER',
      'Complete Your Profile',
      'Please complete your profile setup to start receiving jobs',
      {
        type: 'onboarding'
      }
    );
  } catch (error) {
    console.error('Error creating onboarding notification:', error);
  }
}

/**
 * Create notification for system alert
 */
export async function notifySystemAlert(userId, title, message, metadata = {}) {
  try {
    await createNotification(
      userId,
      'SYSTEM_ALERT',
      title,
      message,
      metadata
    );
  } catch (error) {
    console.error('Error creating system alert:', error);
  }
}

/**
 * Mark notifications as read
 */
export async function markNotificationsAsRead(userId, notificationIds) {
  try {
    await prisma.notification.updateMany({
      where: {
        id: {
          in: notificationIds
        },
        userId
      },
      data: {
        read: true
      }
    });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    throw error;
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(userId) {
  try {
    return await prisma.notification.count({
      where: {
        userId,
        read: false
      }
    });
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    return 0;
  }
} 