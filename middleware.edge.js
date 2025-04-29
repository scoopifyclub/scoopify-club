import { NextResponse } from 'next/server';

// Define which paths are edge-compatible
const EDGE_PATHS = [
  '/api/health',
  '/api/prices',
  '/api/plans',
  '/api/settings',
  '/api/test',
];

// Define runtime for Edge compatibility
export const config = {
  matcher: [
    '/api/auth/:path*',
    '/api/health/:path*',
    '/api/prices/:path*',
    '/api/plans/:path*',
    '/api/settings/:path*',
    '/api/test/:path*',
  ],
  runtime: 'edge',
};

export default async function middleware(request) {
  // Add security headers to all responses
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Don't leak referer to external sites
  response.headers.set('Referrer-Policy', 'same-origin');
  
  // Check if current path is in our Edge-compatible paths
  const url = new URL(request.url);
  const isEdgeCompatible = EDGE_PATHS.some(path => url.pathname.startsWith(path));
  
  if (!isEdgeCompatible) {
    // Pass through to regular middleware for non-edge paths
    return response;
  }
  
  // Edge-specific processing can go here
  // ... 
  
  return response;
} 