"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export const AuthContext = createContext({
  user: null,
  loading: true,
  error: null,
  signIn: async () => {},
  signOut: async () => {},
});

// Helper function for conditional logging
const log = (message, data = null) => {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG_AUTH === 'true') {
        if (data) {
            console.log(`🔐 AUTH: ${message}`, data);
        } else {
            console.log(`🔐 AUTH: ${message}`);
        }
    }
};

export async function checkAuth() {
    try {
        log('Starting checkAuth...');
        
        const response = await fetch('/api/auth/me', {
            credentials: 'include',
        });
        
        log('Response received:', { status: response.status, ok: response.ok });
        
        if (response.ok) {
            const data = await response.json();
            log('User data received:', data);
            return data;
        } else {
            log('Response not OK, setting user to null');
            return null;
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        return null;
    } finally {
        log('Setting loading to false');
    }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const signIn = async (email, password) => {
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to sign in');
      }

      const data = await response.json();
      setUser(data.user);
      toast.success('Signed in successfully');
      router.push('/dashboard');
      return data;
    } catch (error) {
      toast.error(error.message || 'Failed to sign in');
      setError(error.message);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to sign out');
      }

      setUser(null);
      toast.success('Signed out successfully');
      router.push('/auth/signin');
    } catch (error) {
      toast.error(error.message || 'Failed to sign out');
      setError(error.message);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    error,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 