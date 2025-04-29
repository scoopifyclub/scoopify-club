'use client';

import { ThemeProvider } from '@/components/providers/ThemeProvider';

/**
 * @typedef {Object} ProvidersProps
 * @property {React.ReactNode} children - The content to wrap with providers
 */

/**
 * Wraps the application with necessary providers
 * @param {ProvidersProps} props - Component props
 * @returns {JSX.Element} The Providers component
 */
export function Providers({ children }) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            {children}
        </ThemeProvider>
    );
}
