import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

// Request validation schemas
const schemas = {
  '/api/services/schedule': z.object({
    date: z.string().datetime(),
    serviceType: z.enum(['regular', 'one-time', 'extra']),
    timeSlot: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9] (AM|PM)$/)
  }),
  '/api/billing': z.object({
    paymentMethodId: z.string().min(1),
    planId: z.string().min(1)
  }),
  '/api/settings': z.object({
    name: z.string().min(1).max(100),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
    address: z.string().min(1).max(200),
    notificationPreferences: z.object({
      email: z.boolean(),
      sms: z.boolean(),
      serviceReminders: z.boolean(),
      billingAlerts: z.boolean()
    })
  })
};

export async function requestValidator(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const schema = schemas[path as keyof typeof schemas];

  if (!schema) {
    return NextResponse.next();
  }

  try {
    const body = await request.json();
    await schema.parseAsync(body);
    return NextResponse.next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Invalid request format' },
      { status: 400 }
    );
  }
} 