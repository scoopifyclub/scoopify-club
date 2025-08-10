export function validateEnvironment() {
  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'GOOGLE_MAPS_API_KEY'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate JWT secret length
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }

  // Validate database URL format
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('postgres://')) {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection string');
  }

  console.log('✅ Environment validation passed');
}

export function getEnvironmentInfo() {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing',
    jwtSecret: process.env.JWT_SECRET ? 'configured' : 'missing',
    stripeKey: process.env.STRIPE_SECRET_KEY ? 'configured' : 'missing',
    googleMaps: process.env.GOOGLE_MAPS_API_KEY ? 'configured' : 'missing'
  };
}