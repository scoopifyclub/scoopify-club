export function validatePassword(password) {
    const errors = [];
    // Minimum length
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }
    // Contains uppercase
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    // Contains lowercase
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    // Contains number
    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    // Contains special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }
    // No common patterns
    const commonPatterns = [
        'password',
        '123456',
        'qwerty',
        'admin',
        'letmein',
        'welcome',
        'monkey',
        'dragon',
        'baseball',
        'football'
    ];
    if (commonPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
        errors.push('Password contains a common pattern or word');
    }
    return {
        isValid: errors.length === 0,
        errors
    };
}
