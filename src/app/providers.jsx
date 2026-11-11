'use client';

import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/lib/auth-client';
import { useEffect, useState } from 'react';

export function Providers({ children }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="light"
            forcedTheme="light"
            enableSystem={false}
            disableTransitionOnChange
        >
            {mounted ? (
                <AuthProvider>
                    {children}
                </AuthProvider>
            ) : (
                <div className="min-h-screen bg-background">
                    {children}
                </div>
            )}
        </ThemeProvider>
    );
}
