/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/photo-**',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
        pathname: '/photos/**',
      }
    ],
    domains: [
      'localhost',
      'scoopify.club',
      'scoopifyclub.s3.amazonaws.com'
    ]
  },
  serverExternalPackages: ['@prisma/client', 'nodemailer'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't attempt to resolve these modules on the client side
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        aws4: false
      };
    }
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['nodemailer']
  }
}

module.exports = nextConfig 