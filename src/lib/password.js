import { z } from 'zod';

// Enhanced password schema with modern security standards
export const passwordSchema = z
    .string()
    .min(12, 'Password must be at least 12 characters long') // Increased from 8 to 12
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
    .regex(/^(?!.*(.)\1{2,})/, 'Password cannot contain 3 or more repeated characters')
    .regex(/^(?!.*(123|abc|qwe|password|admin|user|test|demo))/, 'Password cannot contain common patterns');

export function validatePassword(password) {
    const errors = [];
    let strength = 'weak';
    let score = 0;
    
    // Length check (increased minimum)
    if (password.length < 12) {
        errors.push('Password must be at least 12 characters long');
    } else if (password.length >= 16) {
        score += 2; // Bonus for longer passwords
    } else {
        score += 1;
    }
    
    // Uppercase check
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    } else {
        score += 1;
    }
    
    // Lowercase check
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    } else {
        score += 1;
    }
    
    // Number check
    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    } else {
        score += 1;
    }
    
    // Special character check
    if (!/[^A-Za-z0-9]/.test(password)) {
        errors.push('Password must contain at least one special character');
    } else {
        score += 1;
    }
    
    // Check for repeated characters
    if (/(.)\1{2,}/.test(password)) {
        errors.push('Password cannot contain 3 or more repeated characters');
    } else {
        score += 1;
    }
    
    // Check for common patterns
    const commonPatterns = ['123', 'abc', 'qwe', 'password', 'admin', 'user', 'test', 'demo'];
    const hasCommonPattern = commonPatterns.some(pattern => 
        password.toLowerCase().includes(pattern)
    );
    if (hasCommonPattern) {
        errors.push('Password cannot contain common patterns');
    } else {
        score += 1;
    }
    
    // Entropy bonus (variety of character types)
    const uniqueChars = new Set(password).size;
    if (uniqueChars >= password.length * 0.7) {
        score += 1; // Bonus for high character variety
    }
    
    // Determine strength based on score
    if (score >= 8) {
        strength = 'very-strong';
    } else if (score >= 6) {
        strength = 'strong';
    } else if (score >= 4) {
        strength = 'medium';
    } else {
        strength = 'weak';
    }
    
    return {
        isValid: errors.length === 0,
        strength,
        score,
        errors,
    };
}

export function getPasswordStrengthColor(strength) {
    switch (strength) {
        case 'very-strong':
            return 'text-emerald-600';
        case 'strong':
            return 'text-green-500';
        case 'medium':
            return 'text-yellow-500';
        case 'weak':
            return 'text-red-500';
        default:
            return 'text-gray-500';
    }
}

export function getPasswordStrengthMessage(strength) {
    switch (strength) {
        case 'very-strong':
            return 'Very strong password';
        case 'strong':
            return 'Strong password';
        case 'medium':
            return 'Medium strength password';
        case 'weak':
            return 'Weak password';
        default:
            return 'Password strength unknown';
    }
}

// Generate a secure random password
export function generateSecurePassword(length = 16) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let password = '';
    
    // Ensure at least one of each required character type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
    password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
    password += '!@#$%^&*()_+-=[]{}|;:,.<>?'[Math.floor(Math.random() * 32)]; // Special
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
        password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
}
