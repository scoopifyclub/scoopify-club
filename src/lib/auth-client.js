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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    console.log('🔍 AUTH: Starting checkAuth...');
    try {
      console.log('🔍 AUTH: Making request to /api/auth/me...');
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });
      console.log('🔍 AUTH: Response received:', response.status, response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 AUTH: User data received:', data);
        setUser(data.user);
      } else {
        console.log('🔍 AUTH: Response not OK, setting user to null');
        setUser(null);
      }
    } catch (error) {
      console.error('🔍 AUTH: Auth check failed:', error);
      setError(error.message);
      setUser(null);
    } finally {
      console.log('🔍 AUTH: Setting loading to false');
      setLoading(false);
    }
  };

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