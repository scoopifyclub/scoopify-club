import DOMPurify from 'dompurify';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Strong password regex (8+ chars, uppercase, lowercase, number, special char)
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Phone number regex (basic US format)
const PHONE_REGEX = /^\+?1?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/;

// ZIP code regex (5 digits or 5+4 format)
const ZIP_REGEX = /^\d{5}(-\d{4})?$/;

// Name regex (letters, spaces, hyphens, apostrophes)
const NAME_REGEX = /^[a-zA-Z\s\-']{2,50}$/;

// URL regex
const URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

export class InputValidator {
  /**
   * Sanitize and validate email
   */
  static validateEmail(email) {
    if (!email || typeof email !== 'string') {
      throw new Error('Email is required and must be a string');
    }

    const sanitized = DOMPurify.sanitize(email.trim().toLowerCase());
    
    if (!EMAIL_REGEX.test(sanitized)) {
      throw new Error('Invalid email format');
    }

    if (sanitized.length > 254) {
      throw new Error('Email is too long');
    }

    return sanitized;
  }

  /**
   * Validate password strength
   */
  static validatePassword(password) {
    if (!password || typeof password !== 'string') {
      throw new Error('Password is required and must be a string');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    if (password.length > 128) {
      throw new Error('Password is too long');
    }

    if (!PASSWORD_REGEX.test(password)) {
      throw new Error('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
    }

    return password;
  }

  /**
   * Sanitize and validate name
   */
  static validateName(name, fieldName = 'Name') {
    if (!name || typeof name !== 'string') {
      throw new Error(`${fieldName} is required and must be a string`);
    }

    const sanitized = DOMPurify.sanitize(name.trim());
    
    if (!NAME_REGEX.test(sanitized)) {
      throw new Error(`${fieldName} must contain only letters, spaces, hyphens, and apostrophes (2-50 characters)`);
    }

    return sanitized;
  }

  /**
   * Validate phone number
   */
  static validatePhone(phone) {
    if (!phone || typeof phone !== 'string') {
      throw new Error('Phone number is required and must be a string');
    }

    const sanitized = phone.replace(/\s/g, '');
    
    if (!PHONE_REGEX.test(sanitized)) {
      throw new Error('Invalid phone number format');
    }

    return sanitized;
  }

  /**
   * Validate ZIP code
   */
  static validateZipCode(zipCode) {
    if (!zipCode || typeof zipCode !== 'string') {
      throw new Error('ZIP code is required and must be a string');
    }

    const sanitized = zipCode.trim();
    
    if (!ZIP_REGEX.test(sanitized)) {
      throw new Error('Invalid ZIP code format');
    }

    return sanitized;
  }

  /**
   * Validate URL
   */
  static validateUrl(url, fieldName = 'URL') {
    if (!url || typeof url !== 'string') {
      throw new Error(`${fieldName} is required and must be a string`);
    }

    const sanitized = DOMPurify.sanitize(url.trim());
    
    if (!URL_REGEX.test(sanitized)) {
      throw new Error(`Invalid ${fieldName.toLowerCase()} format`);
    }

    return sanitized;
  }

  /**
   * Sanitize text input
   */
  static sanitizeText(text, maxLength = 1000) {
    if (!text || typeof text !== 'string') {
      return '';
    }

    const sanitized = DOMPurify.sanitize(text.trim());
    
    if (sanitized.length > maxLength) {
      throw new Error(`Text is too long (maximum ${maxLength} characters)`);
    }

    return sanitized;
  }

  /**
   * Validate numeric input
   */
  static validateNumber(value, fieldName = 'Number', min = null, max = null) {
    if (value === null || value === undefined) {
      throw new Error(`${fieldName} is required`);
    }

    const num = Number(value);
    
    if (isNaN(num)) {
      throw new Error(`${fieldName} must be a valid number`);
    }

    if (min !== null && num < min) {
      throw new Error(`${fieldName} must be at least ${min}`);
    }

    if (max !== null && num > max) {
      throw new Error(`${fieldName} must be no more than ${max}`);
    }

    return num;
  }

  /**
   * Validate date
   */
  static validateDate(dateString, fieldName = 'Date') {
    if (!dateString || typeof dateString !== 'string') {
      throw new Error(`${fieldName} is required and must be a string`);
    }

    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid ${fieldName.toLowerCase()} format`);
    }

    return date;
  }

  /**
   * Validate object structure
   */
  static validateObject(obj, schema, objectName = 'Object') {
    if (!obj || typeof obj !== 'object') {
      throw new Error(`${objectName} is required and must be an object`);
    }

    const validated = {};

    for (const [key, validator] of Object.entries(schema)) {
      if (!(key in obj)) {
        throw new Error(`${objectName} is missing required field: ${key}`);
      }

      try {
        validated[key] = validator(obj[key]);
      } catch (error) {
        throw new Error(`${objectName}.${key}: ${error.message}`);
      }
    }

    return validated;
  }

  /**
   * Validate array
   */
  static validateArray(arr, itemValidator, fieldName = 'Array', maxLength = 100) {
    if (!Array.isArray(arr)) {
      throw new Error(`${fieldName} must be an array`);
    }

    if (arr.length > maxLength) {
      throw new Error(`${fieldName} is too long (maximum ${maxLength} items)`);
    }

    return arr.map((item, index) => {
      try {
        return itemValidator(item);
      } catch (error) {
        throw new Error(`${fieldName}[${index}]: ${error.message}`);
      }
    });
  }

  /**
   * Sanitize HTML content
   */
  static sanitizeHtml(html, allowedTags = ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li']) {
    if (!html || typeof html !== 'string') {
      return '';
    }

    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: allowedTags,
      ALLOWED_ATTR: []
    });
  }

  /**
   * Validate file upload
   */
  static validateFile(file, allowedTypes = ['image/jpeg', 'image/png', 'image/gif'], maxSize = 5 * 1024 * 1024) {
    if (!file) {
      throw new Error('File is required');
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }

    if (file.size > maxSize) {
      throw new Error(`File is too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB`);
    }

    return file;
  }
}

// Common validation schemas
export const ValidationSchemas = {
  user: {
    email: InputValidator.validateEmail,
    password: InputValidator.validatePassword,
    name: (name) => InputValidator.validateName(name, 'Name'),
    phone: InputValidator.validatePhone
  },

  address: {
    street: (text) => InputValidator.sanitizeText(text, 200),
    city: (text) => InputValidator.sanitizeText(text, 100),
    state: (text) => InputValidator.sanitizeText(text, 50),
    zipCode: InputValidator.validateZipCode
  },

  service: {
    title: (text) => InputValidator.sanitizeText(text, 100),
    description: (text) => InputValidator.sanitizeText(text, 1000),
    price: (num) => InputValidator.validateNumber(num, 'Price', 0, 10000),
    duration: (num) => InputValidator.validateNumber(num, 'Duration', 1, 480)
  }
}; 