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
 * Session version: an HMAC over the account's current DB identity
 * (id, email, role, password hash). It is embedded in tokens as `sv` and
 * recomputed from the DB by server-side verifiers, so changing the password
 * (including a password reset) or the role revokes every outstanding session,
 * and a token signed with a leaked JWT_SECRET is useless without the
 * account's password hash. Admin versions also include ADMIN_SESSION_EPOCH,
 * which revokes every admin session when bumped.
 * @param {object} user - User row with id, email, role, password
 * @returns {Promise<string|null>}
 */
export async function computeSessionVersion(user) {
  if (!user?.id || !user?.password) {
    return null;
  }
  const parts = user.role === 'ADMIN'
    ? ['admin-session', process.env.ADMIN_SESSION_EPOCH || '1']
    : ['user-session'];
  const key = await crypto.subtle.importKey(
    'raw',
    JWT_SECRET_BYTES,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const data = new TextEncoder().encode(
    [...parts, user.id, user.email, user.role, user.password].join('|')
  );
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, data));
  return Array.from(signature, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export const computeAdminSessionVersion = computeSessionVersion;

/**
 * True when the token's `sv` claim matches the user's current DB row.
 * Tokens without `sv` (minted before session binding) never match.
 * @param {object} user - User row with id, email, role, password
 * @param {string} sv - The `sv` claim from a verified token
 * @returns {Promise<boolean>}
 */
export async function isCurrentSessionVersion(user, sv) {
  if (typeof sv !== 'string') return false;
  const expected = await computeSessionVersion(user);
  if (!expected || expected.length !== sv.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ sv.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Create a user token with standard claims
 * @param {object} user - User object with id, email, role and password hash
 *   (without the hash the token has no `sv` and DB-backed verifiers reject it)
 * @returns {Promise<string|null>} - The signed token or null if failed
 */
export async function createUserToken(user) {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    type: 'user'
  };

  const sv = await computeSessionVersion(user);
  if (sv) {
    payload.sv = sv;
  }
  
  return await signToken(payload, '24h');
}

/**
 * Create a refresh token
 * @param {object} user - User object with id, email, role and password hash
 * @returns {Promise<string|null>} - The signed refresh token or null if failed
 */
export async function createRefreshToken(user) {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    type: 'refresh'
  };

  const sv = await computeSessionVersion(user);
  if (sv) {
    payload.sv = sv;
  }
  
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

  // Admin tokens issued before session binding (no `sv`) are revoked
  if (payload.role === 'ADMIN' && !payload.sv) {
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
