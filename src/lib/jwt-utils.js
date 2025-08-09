import { jwtVerify, SignJWT } from 'jose';

// Ensure JWT_SECRET is properly loaded from environment
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

const JWT_SECRET_BYTES = new TextEncoder().encode(JWT_SECRET);

/**
 * Verify a JWT token
 * @param {string} token - The JWT token to verify
 * @returns {Promise<object|null>} - The decoded payload or null if invalid
 */
export async function verifyToken(token) {
  try {
    if (!token) {
      return null;
    }
    
    const { payload } = await jwtVerify(token, JWT_SECRET_BYTES);
    return payload;
  } catch (error) {
    console.error('JWT verification failed:', error.message);
    return null;
  }
}

/**
 * Sign a JWT token
 * @param {object} payload - The payload to sign
 * @param {string} expiresIn - Expiration time (default: 24h)
 * @returns {Promise<string|null>} - The signed token or null if failed
 */
export async function signToken(payload, expiresIn = '24h') {
  try {
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expiresIn)
      .sign(JWT_SECRET_BYTES);
    return token;
  } catch (error) {
    console.error('JWT signing failed:', error.message);
    return null;
  }
}

/**
 * Create a user token with standard claims
 * @param {object} user - User object with id, email, role
 * @returns {Promise<string|null>} - The signed token or null if failed
 */
export async function createUserToken(user) {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    type: 'user'
  };
  
  return await signToken(payload, '24h');
}

/**
 * Create a refresh token
 * @param {object} user - User object with id, email, role
 * @returns {Promise<string|null>} - The signed refresh token or null if failed
 */
export async function createRefreshToken(user) {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    type: 'refresh'
  };
  
  return await signToken(payload, '7d');
}

/**
 * Validate user token and extract user info
 * @param {string} token - The JWT token to validate
 * @param {string} expectedRole - Expected user role (optional)
 * @returns {Promise<object|null>} - User info or null if invalid
 */
export async function validateUserToken(token, expectedRole = null) {
  const payload = await verifyToken(token);
  
  if (!payload || payload.type !== 'user') {
    return null;
  }
  
  // Check if token has expired
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }
  
  // Validate role if specified
  if (expectedRole && payload.role !== expectedRole) {
    console.error(`Role mismatch: expected ${expectedRole}, got ${payload.role}`);
    return null;
  }
  
  return {
    userId: payload.userId,
    email: payload.email,
    role: payload.role
  };
}
