import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addDays, addHours, isBefore, startOfDay } from 'date-fns';

// This endpoint should be called by a cron job (e.g., Vercel Cron)
// Recommended schedule: Every hour
export async function POST(request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const results = {
      serviceReminders: 0,
      followUps: 0,
      satisfactionSurveys: 0,
      paymentReminders: 0,
      errors: []
    };

    // Send service reminders (24 hours before service)
    const serviceReminders = await sendServiceReminders(now);
    results.serviceReminders = serviceReminders;

    // Send follow-up messages (2 hours after service completion)
    const followUps = await sendFollowUpMessages(now);
    results.followUps = followUps;

    // Send satisfaction surveys (24 hours after service completion)
    const satisfactionSurveys = await sendSatisfactionSurveys(now);
    results.satisfactionSurveys = satisfactionSurveys;

    // Send payment reminders (for failed payments)
    const paymentReminders = await sendPaymentReminders(now);
    results.paymentReminders = paymentReminders;

    console.log('Customer notification summary:', results);

    return NextResponse.json({
      success: true,
      results: results
    });

  } catch (error) {
    console.error('Error in customer notification processing:', error);
    return NextResponse.json(
      { error: 'Failed to process customer notifications' },
      { status: 500 }
    );
  }
}

async function sendServiceReminders(now) {
  try {
    const tomorrow = addDays(now, 1);
    const tomorrowStart = startOfDay(tomorrow);
    const tomorrowEnd = addDays(tomorrowStart, 1);

    // Get services scheduled for tomorrow
    const upcomingServices = await prisma.service.findMany({
      where: {
        scheduledDate: {
          gte: tomorrowStart,
          lt: tomorrowEnd
        },
        status: 'SCHEDULED'
      },
      include: {
        customer: {
          include: {
            user: true,
            address: true
          }
        },
        employee: true,
        servicePlan: true
      }
    });

    let sentCount = 0;

    for (const service of upcomingServices) {
      try {
        // Check if reminder already sent
        const existingReminder = await prisma.notification.findFirst({
          where: {
            userId: service.customer.userId,
            type: 'SERVICE_REMINDER',
            metadata: {
              path: ['serviceId'],
              equals: service.id
            }
          }
        });

        if (existingReminder) {
          continue; // Reminder already sent
        }

        // Send service reminder
        await sendServiceReminderNotification(service);
        sentCount++;

      } catch (error) {
        console.error(`Error sending service reminder for service ${service.id}:`, error);
      }
    }

    return sentCount;
  } catch (error) {
    console.error('Error in sendServiceReminders:', error);
    return 0;
  }
}

async function sendFollowUpMessages(now) {
  try {
    const twoHoursAgo = addHours(now, -2);
    const threeHoursAgo = addHours(now, -3);

    // Get services completed 2-3 hours ago
    const recentlyCompletedServices = await prisma.service.findMany({
      where: {
        completedDate: {
          gte: threeHoursAgo,
          lte: twoHoursAgo
        },
        status: 'COMPLETED'
      },
      include: {
        customer: {
          include: {
            user: true
          }
        },
        employee: true
      }
    });

    let sentCount = 0;

    for (const service of recentlyCompletedServices) {
      try {
        // Check if follow-up already sent
        const existingFollowUp = await prisma.notification.findFirst({
          where: {
            userId: service.customer.userId,
            type: 'SERVICE_FOLLOW_UP',
            metadata: {
              path: ['serviceId'],
              equals: service.id
            }
          }
        });

        if (existingFollowUp) {
          continue; // Follow-up already sent
        }

        // Send follow-up message
        await sendFollowUpNotification(service);
        sentCount++;

      } catch (error) {
        console.error(`Error sending follow-up for service ${service.id}:`, error);
      }
    }

    return sentCount;
  } catch (error) {
    console.error('Error in sendFollowUpMessages:', error);
    return 0;
  }
}

async function sendSatisfactionSurveys(now) {
  try {
    const yesterday = addDays(now, -1);
    const yesterdayStart = startOfDay(yesterday);
    const yesterdayEnd = addDays(yesterdayStart, 1);

    // Get services completed yesterday
    const completedServices = await prisma.service.findMany({
      where: {
        completedDate: {
          gte: yesterdayStart,
          lt: yesterdayEnd
        },
        status: 'COMPLETED'
      },
      include: {
        customer: {
          include: {
            user: true
          }
        },
        employee: true
      }
    });

    let sentCount = 0;

    for (const service of completedServices) {
      try {
        // Check if survey already sent
        const existingSurvey = await prisma.notification.findFirst({
          where: {
            userId: service.customer.userId,
            type: 'SATISFACTION_SURVEY',
            metadata: {
              path: ['serviceId'],
              equals: service.id
            }
          }
        });

        if (existingSurvey) {
          continue; // Survey already sent
        }

        // Send satisfaction survey
        await sendSatisfactionSurveyNotification(service);
        sentCount++;

      } catch (error) {
        console.error(`Error sending satisfaction survey for service ${service.id}:`, error);
      }
    }

    return sentCount;
  } catch (error) {
    console.error('Error in sendSatisfactionSurveys:', error);
    return 0;
  }
}

async function sendPaymentReminders(now) {
  try {
    const threeDaysAgo = addDays(now, -3);

    // Get failed payments from 3 days ago
    const failedPayments = await prisma.payment.findMany({
      where: {
        status: 'FAILED',
        createdAt: {
          gte: threeDaysAgo
        }
      },
      include: {
        customer: {
          include: {
            user: true
          }
        }
      }
    });

    let sentCount = 0;

    for (const payment of failedPayments) {
      try {
        // Check if reminder already sent
        const existingReminder = await prisma.notification.findFirst({
          where: {
            userId: payment.customer.userId,
            type: 'PAYMENT_REMINDER',
            metadata: {
              path: ['paymentId'],
              equals: payment.id
            }
          }
        });

        if (existingReminder) {
          continue; // Reminder already sent
        }

        // Send payment reminder
        await sendPaymentReminderNotification(payment);
        sentCount++;

      } catch (error) {
        console.error(`Error sending payment reminder for payment ${payment.id}:`, error);
      }
    }

    return sentCount;
  } catch (error) {
    console.error('Error in sendPaymentReminders:', error);
    return 0;
  }
}

async function sendServiceReminderNotification(service) {
  try {
    const serviceTime = new Date(service.scheduledDate);
    const employeeName = service.employee?.name || 'Your service provider';

    await prisma.notification.create({
      data: {
        userId: service.customer.userId,
        type: 'SERVICE_REMINDER',
        title: 'Service Reminder',
        message: `Your service is scheduled for tomorrow at ${serviceTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. ${employeeName} will be arriving to clean your yard.`,
        metadata: {
          serviceId: service.id,
          scheduledDate: service.scheduledDate.toISOString(),
          employeeName: employeeName
        }
      }
    });

    // Send email notification
    await sendEmailNotification({
      to: service.customer.user.email,
      subject: 'Service Reminder - Tomorrow',
      template: 'service-reminder',
      data: {
        customerName: service.customer.user.name,
        serviceTime: serviceTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        serviceDate: serviceTime.toLocaleDateString(),
        employeeName: employeeName,
        address: service.customer.address?.street || 'Your address'
      }
    });

    console.log(`Sent service reminder to ${service.customer.user.email}`);
  } catch (error) {
    console.error('Error sending service reminder notification:', error);
    throw error;
  }
}

async function sendFollowUpNotification(service) {
  try {
    await prisma.notification.create({
      data: {
        userId: service.customer.userId,
        type: 'SERVICE_FOLLOW_UP',
        title: 'Service Completed',
        message: 'Your yard has been cleaned! We hope you\'re satisfied with our service. If you have any questions or concerns, please don\'t hesitate to reach out.',
        metadata: {
          serviceId: service.id,
          completedDate: service.completedDate.toISOString()
        }
      }
    });

    // Send email notification
    await sendEmailNotification({
      to: service.customer.user.email,
      subject: 'Service Completed - How was it?',
      template: 'service-follow-up',
      data: {
        customerName: service.customer.user.name,
        completedDate: service.completedDate.toLocaleDateString(),
        employeeName: service.employee?.name || 'Your service provider'
      }
    });

    console.log(`Sent follow-up to ${service.customer.user.email}`);
  } catch (error) {
    console.error('Error sending follow-up notification:', error);
    throw error;
  }
}

async function sendSatisfactionSurveyNotification(service) {
  try {
    await prisma.notification.create({
      data: {
        userId: service.customer.userId,
        type: 'SATISFACTION_SURVEY',
        title: 'How was your service?',
        message: 'We\'d love to hear about your experience! Please take a moment to rate your recent service and provide feedback.',
        metadata: {
          serviceId: service.id,
          completedDate: service.completedDate.toISOString()
        }
      }
    });

    // Send email notification with survey link
    await sendEmailNotification({
      to: service.customer.user.email,
      subject: 'Rate Your Service Experience',
      template: 'satisfaction-survey',
      data: {
        customerName: service.customer.user.name,
        serviceId: service.id,
        surveyUrl: `${process.env.NEXT_PUBLIC_APP_URL}/survey/${service.id}`
      }
    });

    console.log(`Sent satisfaction survey to ${service.customer.user.email}`);
  } catch (error) {
    console.error('Error sending satisfaction survey notification:', error);
    throw error;
  }
}

async function sendPaymentReminderNotification(payment) {
  try {
    await prisma.notification.create({
      data: {
        userId: payment.customer.userId,
        type: 'PAYMENT_REMINDER',
        title: 'Payment Action Required',
        message: `Your payment of $${payment.amount.toFixed(2)} failed. Please update your payment method to continue receiving services.`,
        metadata: {
          paymentId: payment.id,
          amount: payment.amount
        }
      }
    });

    // Send email notification
    await sendEmailNotification({
      to: payment.customer.user.email,
      subject: 'Payment Failed - Action Required',
      template: 'payment-reminder',
      data: {
        customerName: payment.customer.user.name,
        amount: payment.amount.toFixed(2),
        paymentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`
      }
    });

    console.log(`Sent payment reminder to ${payment.customer.user.email}`);
  } catch (error) {
    console.error('Error sending payment reminder notification:', error);
    throw error;
  }
}

async function sendEmailNotification({ to, subject, template, data }) {
  try {
    // This would integrate with your email service (SendGrid, Mailgun, etc.)
    console.log(`Sending ${template} email to ${to}`);
    console.log('Email data:', { subject, template, data });
    
    // Example integration:
    // await sendGrid.send({
    //   to,
    //   from: 'noreply@scoopify.club',
    //   subject,
    //   templateId: getTemplateId(template),
    //   dynamicTemplateData: data
    // });
    
  } catch (error) {
    console.error('Error sending email notification:', error);
    throw error;
  }
} 