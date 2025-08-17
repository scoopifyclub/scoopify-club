// Notification Service for Subscription-Based Business Model
// Handles service reminders, payment notifications, and customer communications

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class NotificationService {
  constructor() {
    this.emailProvider = process.env.EMAIL_PROVIDER || 'resend';
    this.smsProvider = process.env.SMS_PROVIDER || 'twilio';
  }

  // Service Reminder Notifications
  async sendServiceReminder(customerId, serviceDate, serviceDetails) {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          user: true,
          subscription: true
        }
      });

      if (!customer) {
        throw new Error('Customer not found');
      }

      const reminderData = {
        customerName: customer.user.name,
        customerEmail: customer.user.email,
        serviceDate: serviceDate,
        serviceTime: customer.subscription.preferredTime,
        serviceAddress: customer.subscription.address,
        serviceType: customer.subscription.serviceType,
        specialInstructions: customer.subscription.specialInstructions || 'None'
      };

      // Send email reminder
      await this.sendEmailReminder(reminderData);
      
      // Send SMS reminder (if phone number available)
      if (customer.user.phone) {
        await this.sendSMSReminder(reminderData, customer.user.phone);
      }

      // Log notification
      await this.logNotification({
        customerId,
        type: 'service_reminder',
        channel: 'email_sms',
        data: reminderData,
        status: 'sent'
      });

      return { success: true, message: 'Service reminder sent successfully' };
    } catch (error) {
      console.error('Error sending service reminder:', error);
      await this.logNotification({
        customerId,
        type: 'service_reminder',
        channel: 'email_sms',
        data: { error: error.message },
        status: 'failed'
      });
      throw error;
    }
  }

  // Payment Reminder Notifications
  async sendPaymentReminder(customerId, paymentDueDate, amount) {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          user: true,
          subscription: true
        }
      });

      if (!customer) {
        throw new Error('Customer not found');
      }

      const paymentData = {
        customerName: customer.user.name,
        customerEmail: customer.user.email,
        paymentDueDate: paymentDueDate,
        amount: amount,
        subscriptionType: customer.subscription.serviceType,
        nextBillingDate: customer.subscription.nextBillingDate
      };

      // Send email payment reminder
      await this.sendEmailPaymentReminder(paymentData);
      
      // Send SMS payment reminder (if phone number available)
      if (customer.user.phone) {
        await this.sendSMSPaymentReminder(paymentData, customer.user.phone);
      }

      // Log notification
      await this.logNotification({
        customerId,
        type: 'payment_reminder',
        channel: 'email_sms',
        data: paymentData,
        status: 'sent'
      });

      return { success: true, message: 'Payment reminder sent successfully' };
    } catch (error) {
      console.error('Error sending payment reminder:', error);
      await this.logNotification({
        customerId,
        type: 'payment_reminder',
        channel: 'email_sms',
        data: { error: error.message },
        status: 'failed'
      });
      throw error;
    }
  }

  // Service Completion Notifications
  async sendServiceCompletionNotification(customerId, serviceData) {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          user: true,
          subscription: true
        }
      });

      if (!customer) {
        throw new Error('Customer not found');
      }

      const completionData = {
        customerName: customer.user.name,
        customerEmail: customer.user.email,
        serviceDate: serviceData.serviceDate,
        serviceType: serviceData.serviceType,
        nextServiceDate: serviceData.nextServiceDate,
        photos: serviceData.photos || [],
        notes: serviceData.notes || 'Service completed successfully'
      };

      // Send email completion notification
      await this.sendEmailServiceCompletion(completionData);
      
      // Send SMS completion notification (if phone number available)
      if (customer.user.phone) {
        await this.sendSMSServiceCompletion(completionData, customer.user.phone);
      }

      // Log notification
      await this.logNotification({
        customerId,
        type: 'service_completion',
        channel: 'email_sms',
        data: completionData,
        status: 'sent'
      });

      return { success: true, message: 'Service completion notification sent successfully' };
    } catch (error) {
      console.error('Error sending service completion notification:', error);
      await this.logNotification({
        customerId,
        type: 'service_completion',
        channel: 'email_sms',
        data: { error: error.message },
        status: 'failed'
      });
      throw error;
    }
  }

  // Subscription Status Notifications
  async sendSubscriptionStatusNotification(customerId, status, reason = '') {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          user: true,
          subscription: true
        }
      });

      if (!customer) {
        throw new Error('Customer not found');
      }

      const statusData = {
        customerName: customer.user.name,
        customerEmail: customer.user.email,
        status: status,
        reason: reason,
        subscriptionType: customer.subscription.serviceType,
        nextBillingDate: customer.subscription.nextBillingDate
      };

      // Send email status notification
      await this.sendEmailSubscriptionStatus(statusData);
      
      // Send SMS status notification (if phone number available)
      if (customer.user.phone) {
        await this.sendSMSSubscriptionStatus(statusData, customer.user.phone);
      }

      // Log notification
      await this.logNotification({
        customerId,
        type: 'subscription_status',
        channel: 'email_sms',
        data: statusData,
        status: 'sent'
      });

      return { success: true, message: 'Subscription status notification sent successfully' };
    } catch (error) {
      console.error('Error sending subscription status notification:', error);
      await this.logNotification({
        customerId,
        type: 'subscription_status',
        channel: 'email_sms',
        data: { error: error.message },
        status: 'failed'
      });
      throw error;
    }
  }

  // Email Notification Methods
  async sendEmailReminder(data) {
    const subject = `Service Reminder - ${data.serviceDate}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c5aa0;">Service Reminder</h2>
        <p>Hi ${data.customerName},</p>
        <p>This is a friendly reminder that your weekly service is scheduled for <strong>${data.serviceDate}</strong> at <strong>${data.serviceTime}</strong>.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Service Details:</h3>
          <ul>
            <li><strong>Service Type:</strong> ${data.serviceType}</li>
            <li><strong>Address:</strong> ${data.serviceAddress}</li>
            <li><strong>Special Instructions:</strong> ${data.specialInstructions}</li>
          </ul>
        </div>
        
        <p>Please ensure your yard is accessible for our team. If you need to reschedule or have any questions, please contact us.</p>
        <p>Thank you for choosing our service!</p>
      </div>
    `;

    return await this.sendEmail(data.customerEmail, subject, html);
  }

  async sendEmailPaymentReminder(data) {
    const subject = `Payment Reminder - Due ${data.paymentDueDate}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c5aa0;">Payment Reminder</h2>
        <p>Hi ${data.customerName},</p>
        <p>This is a friendly reminder that your monthly payment of <strong>$${data.amount}</strong> is due on <strong>${data.paymentDueDate}</strong>.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Payment Details:</h3>
          <ul>
            <li><strong>Amount Due:</strong> $${data.amount}</li>
            <li><strong>Due Date:</strong> ${data.paymentDueDate}</li>
            <li><strong>Service Type:</strong> ${data.subscriptionType}</li>
            <li><strong>Next Billing:</strong> ${data.nextBillingDate}</li>
          </ul>
        </div>
        
        <p>Your payment will be automatically processed. If you need to update your payment method, please log into your account.</p>
        <p>Thank you for your business!</p>
      </div>
    `;

    return await this.sendEmail(data.customerEmail, subject, html);
  }

  async sendEmailServiceCompletion(data) {
    const subject = `Service Completed - ${data.serviceDate}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Service Completed</h2>
        <p>Hi ${data.customerName},</p>
        <p>Your weekly service has been completed successfully on <strong>${data.serviceDate}</strong>.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Service Summary:</h3>
          <ul>
            <li><strong>Service Type:</strong> ${data.serviceType}</li>
            <li><strong>Completion Date:</strong> ${data.serviceDate}</li>
            <li><strong>Next Service:</strong> ${data.nextServiceDate}</li>
            <li><strong>Notes:</strong> ${data.notes}</li>
          </ul>
        </div>
        
        ${data.photos.length > 0 ? `
          <div style="margin: 20px 0;">
            <h3>Service Photos:</h3>
            <p>Photos from today's service are available in your account dashboard.</p>
          </div>
        ` : ''}
        
        <p>Your next service is scheduled for <strong>${data.nextServiceDate}</strong>.</p>
        <p>Thank you for choosing our service!</p>
      </div>
    `;

    return await this.sendEmail(data.customerEmail, subject, html);
  }

  async sendEmailSubscriptionStatus(data) {
    const subject = `Subscription Status Update - ${data.status}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c5aa0;">Subscription Status Update</h2>
        <p>Hi ${data.customerName},</p>
        <p>Your subscription status has been updated to: <strong>${data.status}</strong></p>
        
        ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Subscription Details:</h3>
          <ul>
            <li><strong>Service Type:</strong> ${data.subscriptionType}</li>
            <li><strong>Status:</strong> ${data.status}</li>
            <li><strong>Next Billing:</strong> ${data.nextBillingDate}</li>
          </ul>
        </div>
        
        <p>If you have any questions about this status change, please contact our support team.</p>
        <p>Thank you for your business!</p>
      </div>
    `;

    return await this.sendEmail(data.customerEmail, subject, html);
  }

  // SMS Notification Methods (placeholder implementations)
  async sendSMSReminder(data, phoneNumber) {
    const message = `Service reminder: Your weekly service is scheduled for ${data.serviceDate} at ${data.serviceTime}. Address: ${data.serviceAddress}`;
    return await this.sendSMS(phoneNumber, message);
  }

  async sendSMSPaymentReminder(data, phoneNumber) {
    const message = `Payment reminder: Your monthly payment of $${data.amount} is due on ${data.paymentDueDate}.`;
    return await this.sendSMS(phoneNumber, message);
  }

  async sendSMSServiceCompletion(data, phoneNumber) {
    const message = `Service completed on ${data.serviceDate}. Next service scheduled for ${data.nextServiceDate}.`;
    return await this.sendSMS(phoneNumber, message);
  }

  async sendSMSSubscriptionStatus(data, phoneNumber) {
    const message = `Subscription status updated to ${data.status}. Next billing: ${data.nextBillingDate}.`;
    return await this.sendSMS(phoneNumber, message);
  }

  // Core Email and SMS Methods
  async sendEmail(to, subject, html) {
    try {
      // Use our email service from email-service.js
      const { sendEmail } = await import('./email-service.js');
      const result = await sendEmail(to, subject, html);
      return { success: true, provider: 'nodemailer', result };
    } catch (error) {
      console.error('Email sending failed:', error);
      return { success: false, provider: 'nodemailer', error: error.message };
    }
  }

  async sendSMS(to, message) {
    try {
      // For now, we'll use email as SMS fallback until SMS provider is configured
      // In production, you would integrate with Twilio, AWS SNS, or similar
      console.log(`SMS to ${to}: ${message}`);
      
      // Send as email for now (many SMS providers also support email-to-SMS)
      const emailSubject = 'SMS Message';
      const emailHtml = `
        <div style="font-family: Arial, sans-serif;">
          <h3>SMS Message</h3>
          <p><strong>To:</strong> ${to}</p>
          <p><strong>Message:</strong></p>
          <p style="background: #f5f5f5; padding: 15px; border-radius: 5px;">${message}</p>
          <p><em>This message was sent via SMS fallback to email.</em></p>
        </div>
      `;
      
      const emailResult = await this.sendEmail(to, emailSubject, emailHtml);
      return { 
        success: emailResult.success, 
        provider: 'email-fallback', 
        message: 'SMS sent via email fallback'
      };
    } catch (error) {
      console.error('SMS sending failed:', error);
      return { success: false, provider: 'sms', error: error.message };
    }
  }

  // Notification Logging
  async logNotification(notificationData) {
    try {
      await prisma.notificationLog.create({
        data: {
          customerId: notificationData.customerId,
          type: notificationData.type,
          channel: notificationData.channel,
          data: notificationData.data,
          status: notificationData.status,
          sentAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error logging notification:', error);
    }
  }

  // Bulk Notification Methods
  async sendBulkServiceReminders(serviceDate) {
    try {
      const customers = await prisma.customer.findMany({
        where: {
          subscription: {
            status: 'active'
          }
        },
        include: {
          user: true,
          subscription: true
        }
      });

      const results = [];
      for (const customer of customers) {
        try {
          const result = await this.sendServiceReminder(
            customer.id,
            serviceDate,
            {
              serviceType: customer.subscription.serviceType,
              address: customer.subscription.address,
              specialInstructions: customer.subscription.specialInstructions
            }
          );
          results.push({ customerId: customer.id, success: true, result });
        } catch (error) {
          results.push({ customerId: customer.id, success: false, error: error.message });
        }
      }

      return results;
    } catch (error) {
      console.error('Error sending bulk service reminders:', error);
      throw error;
    }
  }

  async sendBulkPaymentReminders(paymentDueDate) {
    try {
      const customers = await prisma.customer.findMany({
        where: {
          subscription: {
            status: 'active'
          }
        },
        include: {
          user: true,
          subscription: true
        }
      });

      const results = [];
      for (const customer of customers) {
        try {
          const result = await this.sendPaymentReminder(
            customer.id,
            paymentDueDate,
            customer.subscription.monthlyTotal
          );
          results.push({ customerId: customer.id, success: true, result });
        } catch (error) {
          results.push({ customerId: customer.id, success: false, error: error.message });
        }
      }

      return results;
    } catch (error) {
      console.error('Error sending bulk payment reminders:', error);
      throw error;
    }
  }

  // Notification Preferences
  async updateNotificationPreferences(customerId, preferences) {
    try {
      await prisma.customer.update({
        where: { id: customerId },
        data: {
          notificationPreferences: preferences
        }
      });

      return { success: true, message: 'Notification preferences updated successfully' };
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  async getNotificationPreferences(customerId) {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: { notificationPreferences: true }
      });

      return customer?.notificationPreferences || {
        email: true,
        sms: false,
        serviceReminders: true,
        paymentReminders: true,
        serviceCompletion: true,
        subscriptionStatus: true
      };
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      throw error;
    }
  }
}

export default NotificationService; 