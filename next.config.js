// Stripe.js (Elements, Checkout redirect, 3DS frames) and Google Maps load
// from these hosts; without them the browser blocks payment and address UI.
export const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://*.js.stripe.com https://maps.googleapis.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https:",
  "frame-src 'self' https://js.stripe.com https://*.js.stripe.com https://hooks.stripe.com https://checkout.stripe.com",
].join('; ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Content-Security-Policy',
            value: contentSecurityPolicy,
          },
        ],
      },
    ];
  },
  
  // Canonical legal pages live at /privacy and /terms.
  async redirects() {
    return [
      {
        source: '/legal/privacy',
        destination: '/privacy',
        permanent: true,
      },
      {
        source: '/legal/terms',
        destination: '/terms',
        permanent: true,
      },
      {
        source: '/legal',
        destination: '/privacy',
        permanent: true,
      },
    ];
  },

  // CORS configuration
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Disable server-side source maps in production
  productionBrowserSourceMaps: false,
  
  // Security: disable powered by header
  poweredByHeader: false,
  
  // Security: enable strict mode
  reactStrictMode: true,
  
  // Security: configure image domains
  images: {
    domains: ['localhost', 'images.pexels.com', 'images.unsplash.com'],
    // Add your production image domains here
  },
  
  // Security: configure external packages
  serverExternalPackages: [],
};

export default nextConfig;
