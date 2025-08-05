import { NextResponse } from 'next/server';

export function securityMiddleware(request) {
  const response = NextResponse.next();

  // Security Headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://maps.googleapis.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://api.stripe.com https://maps.googleapis.com wss:",
    "frame-src 'self' https://js.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);

  // Rate limiting headers (if not already set)
  if (!response.headers.get('X-RateLimit-Limit')) {
    response.headers.set('X-RateLimit-Limit', '100');
    response.headers.set('X-RateLimit-Remaining', '99');
    response.headers.set('X-RateLimit-Reset', Math.floor(Date.now() / 1000 + 3600).toString());
  }

  // Request size limit check
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 1024 * 1024) { // 1MB limit
    return new NextResponse(
      JSON.stringify({ error: 'Request too large' }),
      { status: 413, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return response;
}

// CORS configuration for production
export function corsMiddleware(request) {
  const origin = request.headers.get('origin');
  const allowedOrigins = [
    'https://scoopify.club',
    'https://www.scoopify.club',
    'http://localhost:3000' // Development only
  ];

  const response = NextResponse.next();

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }

  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Max-Age', '86400');

  return response;
}

// Input sanitization middleware
export function sanitizeMiddleware(request) {
  // Sanitize request body for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    // This would be implemented with a library like DOMPurify
    // For now, we'll just validate content type
    const contentType = request.headers.get('content-type');
    if (contentType && !contentType.includes('application/json')) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid content type' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  return NextResponse.next();
}

// Audit logging middleware
export function auditMiddleware(request) {
  const startTime = Date.now();
  
  // Log request details
  console.log(`[AUDIT] ${new Date().toISOString()} - ${request.method} ${request.url} - IP: ${request.headers.get('x-forwarded-for') || request.ip || 'unknown'}`);
  
  // Log authentication attempts
  if (request.url.includes('/api/auth/login') || request.url.includes('/api/admin/login')) {
    console.log(`[AUDIT] Authentication attempt from IP: ${request.headers.get('x-forwarded-for') || request.ip || 'unknown'}`);
  }

  return NextResponse.next();
}

// Main security middleware function
export function applySecurityMiddleware(request) {
  let response = NextResponse.next();
  
  // Apply all security middlewares
  response = securityMiddleware(request);
  response = corsMiddleware(request);
  response = sanitizeMiddleware(request);
  auditMiddleware(request); // This doesn't modify response, just logs
  
  return response;
} 