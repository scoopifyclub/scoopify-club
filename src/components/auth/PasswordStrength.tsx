import { useState, useEffect } from 'react'

interface PasswordStrengthProps {
  password: string
  onChange?: (strength: number) => void
}

export default function PasswordStrength({ password, onChange }: PasswordStrengthProps) {
  const [strength, setStrength] = useState(0)

  useEffect(() => {
    const calculateStrength = () => {
      let score = 0
      
      // Length check
      if (password.length >= 8) score += 1
      if (password.length >= 12) score += 1
      
      // Character type checks
      if (/[A-Z]/.test(password)) score += 1
      if (/[a-z]/.test(password)) score += 1
      if (/[0-9]/.test(password)) score += 1
      if (/[^A-Za-z0-9]/.test(password)) score += 1
      
      // Update strength
      setStrength(score)
      onChange?.(score)
    }

    calculateStrength()
  }, [password, onChange])

  const getStrengthColor = () => {
    if (strength <= 2) return 'bg-red-500'
    if (strength <= 4) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStrengthText = () => {
    if (strength <= 2) return 'Weak'
    if (strength <= 4) return 'Medium'
    return 'Strong'
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${getStrengthColor()} transition-all duration-300`}
            style={{ width: `${(strength / 6) * 100}%` }}
          />
        </div>
        <span className="text-sm text-gray-600">{getStrengthText()}</span>
      </div>
      <ul className="text-sm text-gray-600 space-y-1">
        <li className={password.length >= 8 ? 'text-green-600' : ''}>
          ✓ At least 8 characters
        </li>
        <li className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>
          ✓ At least one uppercase letter
        </li>
        <li className={/[0-9]/.test(password) ? 'text-green-600' : ''}>
          ✓ At least one number
        </li>
        <li className={/[^A-Za-z0-9]/.test(password) ? 'text-green-600' : ''}>
          ✓ At least one special character
        </li>
      </ul>
    </div>
  )
} 