'use client';

import { Progress } from '@/components/ui/progress';

/**
 * @typedef {Object} PasswordStrengthProps
 * @property {string} password - The password to evaluate
 */

/**
 * @typedef {Object} PasswordCriteria
 * @property {boolean} hasMinLength
 * @property {boolean} hasUpperCase
 * @property {boolean} hasLowerCase
 * @property {boolean} hasNumber
 * @property {boolean} hasSpecialChar
 */

/**
 * Calculates the strength of a password based on various criteria
 * @param {string} password - The password to evaluate
 * @returns {PasswordCriteria} Object containing password criteria status
 */
const evaluatePassword = (password) => {
    return {
        hasMinLength: password.length >= 8,
        hasUpperCase: /[A-Z]/.test(password),
        hasLowerCase: /[a-z]/.test(password),
        hasNumber: /[0-9]/.test(password),
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
};

/**
 * Calculates the strength percentage based on criteria
 * @param {PasswordCriteria} criteria - The password criteria object
 * @returns {number} The strength percentage (0-100)
 */
const calculateStrength = (criteria) => {
    const totalCriteria = Object.keys(criteria).length;
    const metCriteria = Object.values(criteria).filter(Boolean).length;
    return (metCriteria / totalCriteria) * 100;
};

/**
 * Gets the color for the strength indicator based on percentage
 * @param {number} strength - The password strength percentage
 * @returns {string} The color class name
 */
const getStrengthColor = (strength) => {
    if (strength < 40) return 'bg-red-500';
    if (strength < 70) return 'bg-yellow-500';
    return 'bg-green-500';
};

/**
 * Password strength indicator component
 * @param {PasswordStrengthProps} props - Component props
 * @returns {JSX.Element} The PasswordStrength component
 */
export default function PasswordStrength({ password }) {
    const criteria = evaluatePassword(password);
    const strength = calculateStrength(criteria);
    const strengthColor = getStrengthColor(strength);

    return (
        <div className="space-y-2">
            <Progress value={strength} className={strengthColor} />
            <ul className="text-sm space-y-1">
                <li className={criteria.hasMinLength ? 'text-green-500' : 'text-gray-500'}>
                    • At least 8 characters
                </li>
                <li className={criteria.hasUpperCase ? 'text-green-500' : 'text-gray-500'}>
                    • At least one uppercase letter
                </li>
                <li className={criteria.hasLowerCase ? 'text-green-500' : 'text-gray-500'}>
                    • At least one lowercase letter
                </li>
                <li className={criteria.hasNumber ? 'text-green-500' : 'text-gray-500'}>
                    • At least one number
                </li>
                <li className={criteria.hasSpecialChar ? 'text-green-500' : 'text-gray-500'}>
                    • At least one special character
                </li>
            </ul>
        </div>
    );
} 