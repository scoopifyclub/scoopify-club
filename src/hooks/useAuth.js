'use client';

import { useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/lib/auth-client';

export function useAuthGuard(options = {}) {
  const context = useContext(AuthContext);
  const router = useRouter();
  
  if (!context) {
    throw new Error('useAuthGuard must be used within an AuthProvider');
  }

  const { user, loading, error } = context;
  const { required = false, role = null, redirectTo = '/login' } = options;

  useEffect(() => {
    if (!loading) {
      // If authentication is required but user is not authenticated
      if (required && !user) {
        router.push(redirectTo);
        return;
      }

      // If specific role is required but user doesn't have it
      if (required && user && role && user.role !== role) {
        // Redirect based on user's actual role
        switch (user.role) {
          case 'ADMIN':
            router.push('/admin/dashboard');
            break;
          case 'EMPLOYEE':
            router.push('/employee/dashboard');
            break;
          case 'CUSTOMER':
            router.push('/customer/dashboard');
            break;
          default:
            router.push('/');
        }
        return;
      }
    }
  }, [loading, user, required, role, redirectTo, router]);

  return {
    user,
    loading,
    error,
    status: loading ? 'loading' : (user ? 'authenticated' : 'unauthenticated'),
    ...context // Include signIn, signOut methods
  };
}

// Also export the main useAuth for backward compatibility
export function useAuth(options = {}) {
  const context = useContext(AuthContext);
  const router = useRouter();
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  const { user, loading, error } = context;
  const { required = false, role = null, redirectTo = '/login' } = options;

  useEffect(() => {
    // Only run guard logic if options are provided
    if (Object.keys(options).length > 0 && !loading) {
      // If authentication is required but user is not authenticated
      if (required && !user) {
        router.push(redirectTo);
        return;
      }

      // If specific role is required but user doesn't have it
      if (required && user && role && user.role !== role) {
        // Redirect based on user's actual role
        switch (user.role) {
          case 'ADMIN':
            router.push('/admin/dashboard');
            break;
          case 'EMPLOYEE':
            router.push('/employee/dashboard');
            break;
          case 'CUSTOMER':
            router.push('/customer/dashboard');
            break;
          default:
            router.push('/');
        }
        return;
      }
    }
  }, [loading, user, required, role, redirectTo, router, options]);

  return {
    user,
    loading,
    error,
    status: loading ? 'loading' : (user ? 'authenticated' : 'unauthenticated'),
    ...context // Include signIn, signOut methods
  };
}
