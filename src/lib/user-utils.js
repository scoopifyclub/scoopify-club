/**
 * Utility functions for handling user data consistently
 */

/**
 * Get the full name of a user, handling both old 'name' field and new 'firstName'/'lastName' fields
 * @param {Object} user - User object
 * @returns {string} Full name or fallback
 */
export function getUserFullName(user) {
  if (!user) return 'Unknown User';
  
  // Check if using new firstName/lastName structure
  if (user.firstName || user.lastName) {
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return `${firstName} ${lastName}`.trim() || 'Unknown User';
  }
  
  // Fallback to old 'name' field
  if (user.name) {
    return user.name;
  }
  
  // Last resort fallbacks
  if (user.email) {
    return user.email.split('@')[0];
  }
  
  return 'Unknown User';
}

/**
 * Get the first name of a user
 * @param {Object} user - User object
 * @returns {string} First name or fallback
 */
export function getUserFirstName(user) {
  if (!user) return 'Unknown';
  
  if (user.firstName) {
    return user.firstName;
  }
  
  if (user.name) {
    return user.name.split(' ')[0] || 'Unknown';
  }
  
  if (user.email) {
    return user.email.split('@')[0];
  }
  
  return 'Unknown';
}

/**
 * Get the last name of a user
 * @param {Object} user - User object
 * @returns {string} Last name or fallback
 */
export function getUserLastName(user) {
  if (!user) return 'User';
  
  if (user.lastName) {
    return user.lastName;
  }
  
  if (user.name) {
    const parts = user.name.split(' ');
    return parts.slice(1).join(' ') || 'User';
  }
  
  return 'User';
}
