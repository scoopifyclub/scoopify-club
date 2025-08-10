import { z } from 'zod';

// Common validation schemas
export const emailSchema = z.string().email('Invalid email address');
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
export const phoneSchema = z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number');

// User validation schemas
export const userCreateSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['CUSTOMER', 'EMPLOYEE', 'ADMIN', 'MANAGER']),
  phone: phoneSchema.optional(),
});

export const userUpdateSchema = z.object({
  email: emailSchema.optional(),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: phoneSchema.optional(),
  role: z.enum(['CUSTOMER', 'EMPLOYEE', 'ADMIN', 'MANAGER']).optional(),
});

// Customer validation schemas
export const customerCreateSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  address: z.object({
    street: z.string().min(5, 'Street address must be at least 5 characters'),
    city: z.string().min(2, 'City must be at least 2 characters'),
    state: z.string().length(2, 'State must be 2 characters'),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code'),
    coordinates: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }).optional(),
  }),
  preferences: z.object({
    serviceFrequency: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY']),
    preferredTime: z.string().optional(),
    specialInstructions: z.string().max(500, 'Special instructions too long').optional(),
  }).optional(),
});

// Service validation schemas
export const serviceCreateSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  serviceType: z.enum(['POOP_SCOOP', 'CLEANUP', 'MAINTENANCE']),
  scheduledDate: z.string().datetime('Invalid date format'),
  address: z.object({
    street: z.string().min(5, 'Street address must be at least 5 characters'),
    city: z.string().min(2, 'City must be at least 2 characters'),
    state: z.string().length(2, 'State must be 2 characters'),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code'),
    coordinates: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }).optional(),
  }),
  specialInstructions: z.string().max(500, 'Special instructions too long').optional(),
});

export const serviceUpdateSchema = z.object({
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  scheduledDate: z.string().datetime('Invalid date format').optional(),
  specialInstructions: z.string().max(500, 'Special instructions too long').optional(),
  rating: z.number().min(1).max(5).optional(),
  feedback: z.string().max(1000, 'Feedback too long').optional(),
});

// Payment validation schemas
export const paymentCreateSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().default('USD'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  description: z.string().max(200, 'Description too long').optional(),
});

// Employee validation schemas
export const employeeCreateSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  employeeId: z.string().min(3, 'Employee ID must be at least 3 characters'),
  hireDate: z.string().datetime('Invalid hire date'),
  hourlyRate: z.number().positive('Hourly rate must be positive'),
  serviceAreas: z.array(z.string().uuid('Invalid service area ID')).optional(),
  emergencyContact: z.object({
    name: z.string().min(2, 'Emergency contact name must be at least 2 characters'),
    phone: phoneSchema,
    relationship: z.string().min(2, 'Relationship must be at least 2 characters'),
  }).optional(),
});

// Photo validation schemas
export const photoUploadSchema = z.object({
  serviceId: z.string().uuid('Invalid service ID'),
  description: z.string().max(200, 'Description too long').optional(),
  expiresAt: z.string().datetime('Invalid expiration date').optional(),
});

// Generic validation function
export async function validateRequest(schema, data) {
  try {
    const validatedData = await schema.parseAsync(data);
    return { success: true, data: validatedData, errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }));
      return { success: false, data: null, errors };
    }
    return { success: false, data: null, errors: [{ field: 'unknown', message: 'Validation failed', code: 'UNKNOWN' }] };
  }
}

// Sanitize input data
export function sanitizeInput(data) {
  if (typeof data === 'string') {
    // Remove potentially dangerous characters
    return data
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return data;
}

// Validate and sanitize request body
export async function validateAndSanitizeRequest(schema, request) {
  try {
    const body = await request.json();
    const sanitizedBody = sanitizeInput(body);
    const validation = await validateRequest(schema, sanitizedBody);
    
    if (!validation.success) {
      return {
        success: false,
        errors: validation.errors,
        status: 400
      };
    }
    
    return {
      success: true,
      data: validation.data,
      errors: null
    };
  } catch (error) {
    return {
      success: false,
      errors: [{ field: 'body', message: 'Invalid JSON body', code: 'INVALID_JSON' }],
      status: 400
    };
  }
}

// Export commonly used schemas
export const schemas = {
  user: {
    create: userCreateSchema,
    update: userUpdateSchema,
  },
  customer: {
    create: customerCreateSchema,
  },
  service: {
    create: serviceCreateSchema,
    update: serviceUpdateSchema,
  },
  payment: {
    create: paymentCreateSchema,
  },
  employee: {
    create: employeeCreateSchema,
  },
  photo: {
    upload: photoUploadSchema,
  },
};
