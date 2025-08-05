import { NextResponse } from 'next/server';

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map();

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per minute

export function rateLimit(ip) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  if (!rateLimitStore.has(ip)) {
    rateLimitStore.set(ip, []);
  }
  
  const requests = rateLimitStore.get(ip).filter(time => time > windowStart);
  requests.push(now);
  rateLimitStore.set(ip, requests);
  
  return requests.length <= RATE_LIMIT_MAX_REQUESTS;
}

export function withRateLimit(handler) {
  return async (request, context) => {
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    if (!rateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }
    
    return handler(request, context);
  };
}

// Security headers middleware
export function withSecurityHeaders(handler) {
  return async (request, context) => {
    const response = await handler(request, context);
    
    // Add security headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;");
    
    return response;
  };
}

// Authentication middleware
export function withAuth(handler) {
  return async (request, context) => {
    try {
      // Check for authentication token
      const authHeader = request.headers.get('authorization');
      const sessionToken = request.cookies.get('session-token')?.value;
      
      if (!authHeader && !sessionToken) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      
      // In production, validate the token properly
      // For now, we'll just check if it exists
      if (authHeader && !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Invalid authorization header' },
          { status: 401 }
        );
      }
      
      return handler(request, context);
    } catch (error) {
      console.error('Authentication error:', error);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }
  };
}

// Input validation middleware
export function withValidation(schema) {
  return (handler) => {
    return async (request, context) => {
      try {
        if (request.method === 'POST' || request.method === 'PUT') {
          const body = await request.json();
          
          // Basic validation - in production, use a proper validation library like Zod
          if (schema && typeof schema.parse === 'function') {
            schema.parse(body);
          }
        }
        
        return handler(request, context);
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid input data', details: error.message },
          { status: 400 }
        );
      }
    };
  };
}

// Error handling middleware
export function withErrorHandling(handler) {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error('API Error:', error);
      
      // Don't expose internal errors in production
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      return NextResponse.json(
        { 
          error: 'Internal server error',
          ...(isDevelopment && { details: error.message })
        },
        { status: 500 }
      );
    }
  };
}

// Combined middleware for API routes
export function withApiSecurity(handler, options = {}) {
  const { 
    requireAuth = true, 
    rateLimit: enableRateLimit = true,
    validate = null 
  } = options;
  
  let wrappedHandler = handler;
  
  // Apply validation if schema provided
  if (validate) {
    wrappedHandler = withValidation(validate)(wrappedHandler);
  }
  
  // Apply authentication if required
  if (requireAuth) {
    wrappedHandler = withAuth(wrappedHandler);
  }
  
  // Apply rate limiting
  if (enableRateLimit) {
    wrappedHandler = withRateLimit(wrappedHandler);
  }
  
  // Apply security headers
  wrappedHandler = withSecurityHeaders(wrappedHandler);
  
  // Apply error handling
  wrappedHandler = withErrorHandling(wrappedHandler);
  
  return wrappedHandler;
}
