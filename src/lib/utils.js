import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
// Utility functions for the application

/**
 * Generate a UUID that works across all environments
 * Uses a simple random string approach that works everywhere
 */
export function generateUUID() {
  // Simple UUID v4-like generator that works in all environments
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2);
  const randomPart2 = Math.random().toString(36).substring(2);
  
  return `${timestamp}-${randomPart.substring(0, 4)}-${randomPart.substring(4, 8)}-${randomPart2.substring(0, 4)}-${randomPart2.substring(4, 12)}`;
}

/**
 * Generate a simple random ID for cases where UUID is not needed
 */
export function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Format currency for display
 */
export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Format date for display
 */
export function formatDate(date, options = {}) {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };
  
  return new Intl.DateTimeFormat('en-US', defaultOptions).format(new Date(date));
}

/**
 * Format date and time for display
 */
export function formatDateTime(date, options = {}) {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };
  
  return new Intl.DateTimeFormat('en-US', defaultOptions).format(new Date(date));
}

/**
 * Debounce function to limit how often a function can be called
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit how often a function can be called
 */
export function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate US ZIP code format
 */
export function isValidZipCode(zipCode) {
  const zipRegex = /^\d{5}(-\d{4})?$/;
  return zipRegex.test(zipCode);
}

/**
 * Sanitize string for safe display
 */
export function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>]/g, '');
}

/**
 * Truncate text to specified length
 */
export function truncateText(text, maxLength = 100) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
export function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}
function deg2rad(deg) {
    return deg * (Math.PI / 180);
}
export function calculateReferralCommission(amount) {
    return amount * 0.1; // 10% commission
}
/**
 * Generate a random referral code
 * @returns A random alphanumeric code
 */
export function generateReferralCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing characters like 0, O, 1, I
    let code = '';
    // Generate a 6-character code
    for (let i = 0; i < 6; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        code += chars[randomIndex];
    }
    return code;
}
