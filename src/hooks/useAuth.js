'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function useAuth({ required = false, role = null, redirectTo = '/auth/signin' } = {}) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Define checkAuth outside useEffect so it can be returned from the hook
    const checkAuth = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/auth/session', {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch session');
            }

            const data = await response.json();

            if (data.user) {
                setUser(data.user);
                
                // Check role requirement if specified
                if (role && data.user.role !== role) {
                    router.push(redirectTo);
                }
            } else if (required) {
                // Redirect if auth is required and no user
                router.push(`${redirectTo}?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            if (required) {
                router.push(`${redirectTo}?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, [required, role, redirectTo]);

    const logout = async () => {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
            if (response.ok) {
                setUser(null);
                toast.success('Logged out successfully');
                router.push('/login');
            }
            else {
                throw new Error('Logout failed');
            }
        }
        catch (error) {
            console.error('Logout error:', error);
            toast.error('Failed to logout');
        }
    };

    return {
        user,
        loading,
        isAuthenticated: !!user,
        role: user?.role,
        logout,
        checkSession: checkAuth
    };
}
