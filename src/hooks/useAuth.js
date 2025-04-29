'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function useAuth() {
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
                    setUser(data.user);
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        }

        checkAuth();
    }, []);

    const logout = async () => {
        try {
            const response = await fetch('/api/auth/signout', {
                method: 'POST',
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Logout failed');
            }

            setUser(null);
            toast.success('Logged out successfully');
            router.push('/auth/signin');
        } catch (error) {
            console.error('Logout error:', error);
            toast.error('Failed to logout');
        }
    };

    const refreshUser = async () => {
        try {
            const response = await fetch('/api/auth/verify', {
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (data.success && data.user) {
                setUser(data.user);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error('User refresh failed:', error);
            setUser(null);
        }
    };

    return {
        user,
        loading,
        isAuthenticated: !!user,
        logout,
        refreshUser
    };
}
