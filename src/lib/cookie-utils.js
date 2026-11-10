import { cookies } from 'next/headers';
import {
  getRequestAuthToken,
  setSessionCookies,
  clearSessionCookies,
  ACCESS_TOKEN_COOKIE,
} from '@/lib/auth-cookies';

/**
 * Safely get cookies with proper async handling
 * @param {Request} request - The request object
 * @returns {Promise<object>} - Cookie store object
 */
export async function getCookies(request) {
  try {
    // If we have a request object, use it
    if (request && request.cookies) {
      return request.cookies;
    }
    
    // Otherwise, use the Next.js cookies() function
    return await cookies();
  } catch (error) {
    console.error('Error getting cookies:', error);
    // Return a mock cookie store that won't crash
    return {
      get: () => ({ value: null }),
      set: () => {},
      delete: () => {},
      getAll: () => []
    };
  }
}

/**
 * Get a specific cookie value safely
 * @param {Request} request - The request object
 * @param {string} name - Cookie name
 * @returns {Promise<string|null>} - Cookie value or null
 */
export async function getCookie(request, name) {
  try {
    const cookieStore = await getCookies(request);
    return cookieStore.get(name)?.value || null;
  } catch (error) {
    console.error(`Error getting cookie ${name}:`, error);
    return null;
  }
}

/**
 * Get the session access token (Bearer or accessToken cookie).
 * @param {Request} request - The request object
 * @returns {Promise<string|null>} - Token value or null
 */
export async function getAuthToken(request) {
  return getRequestAuthToken(request);
}

/**
 * Set a cookie safely
 * @param {Response} response - The response object
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {object} options - Cookie options
 */
export function setCookie(response, name, value, options = {}) {
  try {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      ...options
    };
    
    response.cookies.set(name, value, cookieOptions);
  } catch (error) {
    console.error(`Error setting cookie ${name}:`, error);
  }
}

/**
 * Delete a cookie safely
 * @param {Response} response - The response object
 * @param {string} name - Cookie name
 */
export function deleteCookie(response, name) {
  try {
    response.cookies.delete(name);
  } catch (error) {
    console.error(`Error deleting cookie ${name}:`, error);
  }
}

export {
  getRequestAuthToken,
  setSessionCookies,
  clearSessionCookies,
  ACCESS_TOKEN_COOKIE,
};
