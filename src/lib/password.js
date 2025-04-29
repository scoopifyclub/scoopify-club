import { z } from 'zod';
export const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');
export function validatePassword(password) {
    const errors = [];
    let strength = 'weak';
    let score = 0;
    // Length check
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }
    else {
        score++;
    }
    // Uppercase check
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    else {
        score++;
    }
    // Lowercase check
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    else {
        score++;
    }
    // Number check
    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    else {
        score++;
    }
    // Special character check
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }
    else {
        score++;
    }
    // Determine strength
    if (score >= 4) {
        strength = 'strong';
    }
    else if (score >= 2) {
        strength = 'medium';
    }
    return {
        isValid: errors.length === 0,
        strength,
        errors,
    };
}
export function getPasswordStrengthColor(strength) {
    switch (strength) {
        case 'strong':
            return 'text-green-500';
        case 'medium':
            return 'text-yellow-500';
        case 'weak':
            return 'text-red-500';
    }
}
export function getPasswordStrengthMessage(strength) {
    switch (strength) {
        case 'strong':
            return 'Strong password';
        case 'medium':
            return 'Medium strength password';
        case 'weak':
            return 'Weak password';
    }
}
