'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function useAuth({ required = true, role = null, redirectTo = '/login' } = {}) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function checkAuth() {
            try {
                const response = await fetch('/api/auth/verify', {
                    credentials: 'include'
                });
                
                const data = await response.json();
                
                if (data.success && data.user) {
                    // If role is required and user doesn't have it, redirect
                    if (role && data.user.role !== role) {
                        router.push('/');
                        return;
                    }
                    setUser(data.user);
                } else if (required) {
                    // If auth is required and we don't have it, redirect
                    const callbackUrl = encodeURIComponent(window.location.pathname);
                    router.push(`${redirectTo}?callbackUrl=${callbackUrl}`);
                    return;
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                if (required) {
                    const callbackUrl = encodeURIComponent(window.location.pathname);
                    router.push(`${redirectTo}?callbackUrl=${callbackUrl}`);
                    return;
                }
            } finally {
                setLoading(false);
            }
        }

        checkAuth();
    }, [required, role, redirectTo, router]);

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
        status: loading ? 'loading' : user ? 'authenticated' : 'unauthenticated',
        logout,
        role: user?.role
    };
}
