import fs from 'fs';
import path from 'path';

/**
 * SSL/HTTPS Configuration for Production
 * This utility ensures proper SSL setup for Stripe and secure communications
 */

// SSL configuration options
export const SSL_CONFIG = {
  // Production SSL requirements
  production: {
    requireSSL: true,
    redirectHTTP: true,
    hsts: true,
    secureCookies: true,
    csp: true,
  },
  
  // Development SSL options
  development: {
    requireSSL: false,
    redirectHTTP: false,
    hsts: false,
    secureCookies: false,
    csp: true,
  }
};

/**
 * Check if SSL is properly configured for the current environment
 * @returns {object} - SSL configuration status
 */
export function checkSSLConfiguration() {
  const isProduction = process.env.NODE_ENV === 'production';
  const isVercel = process.env.VERCEL === '1';
  const hasCustomDomain = process.env.CUSTOM_DOMAIN === 'true';
  
  const config = isProduction ? SSL_CONFIG.production : SSL_CONFIG.development;
  
  // Check environment variables
  const envChecks = {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    CUSTOM_DOMAIN: process.env.CUSTOM_DOMAIN,
    FORCE_HTTPS: process.env.FORCE_HTTPS,
    SSL_CERT_PATH: process.env.SSL_CERT_PATH,
    SSL_KEY_PATH: process.env.SSL_KEY_PATH,
  };
  
  // Check if running on HTTPS
  const isHTTPS = process.env.HTTPS === 'true' || 
                  process.env.FORCE_HTTPS === 'true' ||
                  (isVercel && !isVercel.startsWith('http://'));
  
  // Check Stripe configuration
  const stripeChecks = {
    hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
    hasStripeWebhook: !!process.env.STRIPE_WEBHOOK_SECRET,
    stripeMode: process.env.STRIPE_MODE || 'test',
  };
  
  // SSL certificate checks (for custom deployments)
  let certificateChecks = {};
  if (!isVercel && isProduction) {
    const certPath = process.env.SSL_CERT_PATH || '/etc/ssl/certs/ssl-cert-snakeoil.pem';
    const keyPath = process.env.SSL_KEY_PATH || '/etc/ssl/private/ssl-cert-snakeoil.key';
    
    certificateChecks = {
      certExists: fs.existsSync(certPath),
      keyExists: fs.existsSync(keyPath),
      certPath,
      keyPath,
    };
  }
  
  const status = {
    environment: process.env.NODE_ENV,
    isProduction,
    isVercel,
    hasCustomDomain,
    isHTTPS,
    config,
    envChecks,
    stripeChecks,
    certificateChecks,
    warnings: [],
    errors: [],
  };
  
  // Generate warnings and errors
  if (isProduction && !isHTTPS) {
    status.warnings.push('Production environment should use HTTPS');
  }
  
  if (isProduction && stripeChecks.hasStripeKey && !isHTTPS) {
    status.errors.push('Stripe requires HTTPS in production');
  }
  
  if (isProduction && !isVercel && !certificateChecks.certExists) {
    status.warnings.push('SSL certificate not found at specified path');
  }
  
  if (isProduction && !isVercel && !certificateChecks.keyExists) {
    status.warnings.push('SSL private key not found at specified path');
  }
  
  return status;
}

/**
 * Get SSL configuration for the current environment
 * @returns {object} - SSL configuration
 */
export function getSSLConfig() {
  const isProduction = process.env.NODE_ENV === 'production';
  const isVercel = process.env.VERCEL === '1';
  
  let config = {
    ...SSL_CONFIG[isProduction ? 'production' : 'development']
  };
  
  // Override for Vercel (handles SSL automatically)
  if (isVercel) {
    config.requireSSL = true;
    config.redirectHTTP = true;
    config.hsts = true;
    config.secureCookies = true;
  }
  
  // Override with environment variables
  if (process.env.FORCE_HTTPS === 'true') {
    config.requireSSL = true;
    config.redirectHTTP = true;
  }
  
  return config;
}

/**
 * Create HTTPS server configuration
 * @returns {object|null} - HTTPS server options or null if not needed
 */
export function createHTTPSConfig() {
  const sslStatus = checkSSLConfiguration();
  const sslConfig = getSSLConfig();
  
  // If not requiring SSL or running on Vercel, return null
  if (!sslConfig.requireSSL || sslStatus.isVercel) {
    return null;
  }
  
  // Check for SSL certificates
  const certPath = process.env.SSL_CERT_PATH || '/etc/ssl/certs/ssl-cert-snakeoil.pem';
  const keyPath = process.env.SSL_KEY_PATH || '/etc/ssl/private/ssl-cert-snakeoil.key';
  
  if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
    console.warn('SSL certificates not found, HTTPS server cannot be created');
    return null;
  }
  
  try {
    return {
      cert: fs.readFileSync(certPath),
      key: fs.readFileSync(keyPath),
      // Additional SSL options
      minVersion: 'TLSv1.2',
      ciphers: [
        'ECDHE-RSA-AES128-GCM-SHA256',
        'ECDHE-RSA-AES256-GCM-SHA384',
        'ECDHE-RSA-AES128-SHA256',
        'ECDHE-RSA-AES256-SHA384',
      ].join(':'),
    };
  } catch (error) {
    console.error('Error reading SSL certificates:', error);
    return null;
  }
}

/**
 * Create security headers for HTTPS
 * @returns {object} - Security headers
 */
export function createSecurityHeaders() {
  const sslConfig = getSSLConfig();
  const headers = {};
  
  // HSTS header
  if (sslConfig.hsts) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
  }
  
  // Upgrade insecure requests
  if (sslConfig.requireSSL) {
    headers['Upgrade-Insecure-Requests'] = '1';
  }
  
  // Content Security Policy
  if (sslConfig.csp) {
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
    ];
    
    if (sslConfig.requireSSL) {
      csp.push("upgrade-insecure-requests");
    }
    
    headers['Content-Security-Policy'] = csp.join('; ');
  }
  
  return headers;
}

/**
 * Validate Stripe configuration for HTTPS requirements
 * @returns {object} - Validation result
 */
export function validateStripeSSL() {
  const sslStatus = checkSSLConfiguration();
  const stripeChecks = sslStatus.stripeChecks;
  
  if (!stripeChecks.hasStripeKey) {
    return { valid: true, message: 'No Stripe configuration found' };
  }
  
  if (sslStatus.isProduction && !sslStatus.isHTTPS) {
    return {
      valid: false,
      message: 'Stripe requires HTTPS in production',
      severity: 'error'
    };
  }
  
  if (stripeChecks.stripeMode === 'live' && !sslStatus.isHTTPS) {
    return {
      valid: false,
      message: 'Live Stripe mode requires HTTPS',
      severity: 'error'
    };
  }
  
  return { valid: true, message: 'Stripe SSL configuration is valid' };
}

/**
 * Generate SSL configuration recommendations
 * @returns {object} - Configuration recommendations
 */
export function generateSSLRecommendations() {
  const sslStatus = checkSSLConfiguration();
  const recommendations = [];
  
  if (sslStatus.isProduction && !sslStatus.isHTTPS) {
    recommendations.push({
      priority: 'high',
      message: 'Enable HTTPS for production environment',
      action: 'Set FORCE_HTTPS=true or configure SSL certificates'
    });
  }
  
  if (sslStatus.isProduction && sslStatus.stripeChecks.hasStripeKey && !sslStatus.isHTTPS) {
    recommendations.push({
      priority: 'critical',
      message: 'Stripe payments require HTTPS in production',
      action: 'Enable HTTPS immediately to avoid payment failures'
    });
  }
  
  if (sslStatus.isProduction && !sslStatus.isVercel && !sslStatus.certificateChecks.certExists) {
    recommendations.push({
      priority: 'medium',
      message: 'SSL certificate not found',
      action: 'Install SSL certificate or use Let\'s Encrypt'
    });
  }
  
  if (!sslStatus.isVercel && sslStatus.isProduction) {
    recommendations.push({
      priority: 'medium',
      message: 'Consider using Vercel for automatic SSL management',
      action: 'Deploy to Vercel or configure custom SSL certificates'
    });
  }
  
  return recommendations;
}

/**
 * Check if current setup meets production SSL requirements
 * @returns {boolean} - True if SSL requirements are met
 */
export function meetsProductionSSLRequirements() {
  const sslStatus = checkSSLConfiguration();
  const sslConfig = getSSLConfig();
  
  if (!sslStatus.isProduction) {
    return true; // Development doesn't require SSL
  }
  
  // Must have HTTPS
  if (!sslStatus.isHTTPS) {
    return false;
  }
  
  // Must have secure cookies
  if (!sslConfig.secureCookies) {
    return false;
  }
  
  // Must have HSTS
  if (!sslConfig.hsts) {
    return false;
  }
  
  return true;
}
