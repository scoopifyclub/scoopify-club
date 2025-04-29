/**
 * @typedef {import('next-auth').DefaultSession} DefaultSession
 */

/**
 * @typedef {Object} SessionUser
 * @property {string} [role] - The user's role
 * @property {string} name - The user's name
 * @property {string} email - The user's email
 * @property {string} [image] - The user's profile image URL
 */

/**
 * @typedef {Object} Session
 * @property {SessionUser} user - The user object
 */

/**
 * This module extends the NextAuth types to include custom properties.
 * The types are used by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context.
 */ 