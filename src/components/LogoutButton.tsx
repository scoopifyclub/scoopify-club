'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export default function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const clearClientStorage = () => {
    // Clear localStorage
    try {
      localStorage.clear()
    } catch (e) {
      console.error('Error clearing localStorage:', e)
    }

    // Clear sessionStorage
    try {
      sessionStorage.clear()
    } catch (e) {
      console.error('Error clearing sessionStorage:', e)
    }

    // Clear all cookies
    document.cookie.split(';').forEach(cookie => {
      document.cookie = cookie
        .replace(/^ +/, '')
        .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`)
    })
  }

  const handleLogout = async () => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // Clear client-side storage regardless of server response
      clearClientStorage()

      if (response.ok) {
        // Set flag to indicate successful logout
        sessionStorage.setItem('justLoggedOut', 'true');
        // Force reload to clear any remaining state
        window.location.href = '/login'
      } else {
        console.error('Logout failed')
        // Still redirect even if server logout fails
        sessionStorage.setItem('justLoggedOut', 'true');
        window.location.href = '/login'
      }
    } catch (error) {
      console.error('Error during logout:', error)
      // Still clear storage and redirect on error
      clearClientStorage()
      sessionStorage.setItem('justLoggedOut', 'true');
      window.location.href = '/login'
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      disabled={isLoading}
      className="w-full justify-start"
    >
      <LogOut className="mr-2 h-4 w-4" />
      {isLoading ? 'Logging out...' : 'Logout'}
    </Button>
  )
} 