'use client';
import { useState, useEffect } from 'react';
import { validatePassword, getPasswordStrengthColor, getPasswordStrengthMessage } from '@/lib/password';
export default function PasswordStrength({ password, onChange }) {
    const [validation, setValidation] = useState({
        isValid: false,
        errors: [],
        strength: 'weak'
    });
    useEffect(() => {
        const result = validatePassword(password);
        setValidation(result);
        onChange === null || onChange === void 0 ? void 0 : onChange(result.isValid);
    }, [password, onChange]);
    return (<div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className={`h-full transition-all duration-300 ${validation.strength === 'strong'
            ? 'bg-green-500'
            : validation.strength === 'medium'
                ? 'bg-yellow-500'
                : 'bg-red-500'}`} style={{
            width: validation.strength === 'strong' ? '100%' : validation.strength === 'medium' ? '66%' : '33%',
        }}/>
        </div>
        <span className={`text-sm font-medium ${getPasswordStrengthColor(validation.strength)}`}>
          {getPasswordStrengthMessage(validation.strength)}
        </span>
      </div>

      <ul className="text-sm text-gray-600 space-y-1">
        <li className={`flex items-center gap-2 ${password.length >= 8 ? 'text-green-500' : ''}`}>
          <span>{password.length >= 8 ? '✓' : '•'}</span>
          At least 8 characters long
        </li>
        <li className={`flex items-center gap-2 ${/[A-Z]/.test(password) ? 'text-green-500' : ''}`}>
          <span>{/[A-Z]/.test(password) ? '✓' : '•'}</span>
          At least one uppercase letter
        </li>
        <li className={`flex items-center gap-2 ${/[a-z]/.test(password) ? 'text-green-500' : ''}`}>
          <span>{/[a-z]/.test(password) ? '✓' : '•'}</span>
          At least one lowercase letter
        </li>
        <li className={`flex items-center gap-2 ${/[0-9]/.test(password) ? 'text-green-500' : ''}`}>
          <span>{/[0-9]/.test(password) ? '✓' : '•'}</span>
          At least one number
        </li>
        <li className={`flex items-center gap-2 ${/[^A-Za-z0-9]/.test(password) ? 'text-green-500' : ''}`}>
          <span>{/[^A-Za-z0-9]/.test(password) ? '✓' : '•'}</span>
          At least one special character
        </li>
      </ul>

      {validation.errors.length > 0 && (<div className="mt-2 text-sm text-red-500">
          {validation.errors.map((error, index) => (<p key={index}>{error}</p>))}
        </div>)}
    </div>);
}
