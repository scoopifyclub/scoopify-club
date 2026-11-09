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
 * Admin session version: an HMAC over the admin's current DB identity
 * (id, email, role, password hash) plus ADMIN_SESSION_EPOCH. It is embedded
 * in admin tokens as `sv` and recomputed from the DB on every privileged
 * request, so a token signed with a leaked JWT_SECRET is still useless
 * without the account's password hash, and changing the password, the role
 * or ADMIN_SESSION_EPOCH revokes every outstanding admin session.
 * @param {object} user - User row with id, email, role, password
 * @returns {Promise<string|null>}
 */
export async function computeAdminSessionVersion(user) {
  if (!user?.id || !user?.password) {
    return null;
  }
  const epoch = process.env.ADMIN_SESSION_EPOCH || '1';
  const key = await crypto.subtle.importKey(
    'raw',
    JWT_SECRET_BYTES,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const data = new TextEncoder().encode(
    ['admin-session', epoch, user.id, user.email, user.role, user.password].join('|')
  );
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, data));
  return Array.from(signature, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Create a user token with standard claims
 * @param {object} user - User object with id, email, role (and password for admins)
 * @returns {Promise<string|null>} - The signed token or null if failed
 */
export async function createUserToken(user) {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    type: 'user'
  };

  if (user.role === 'ADMIN') {
    const sv = await computeAdminSessionVersion(user);
    if (sv) {
      payload.sv = sv;
    }
  }
  
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
    role: payload.role,
    sv: payload.sv
  };
}
