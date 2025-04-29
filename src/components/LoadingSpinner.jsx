import { Loader2 } from 'lucide-react';

/**
 * @typedef {Object} LoadingSpinnerProps
 * @property {number} [size=24] - The size of the spinner in pixels
 * @property {string} [className=''] - Additional CSS classes to apply
 */

/**
 * LoadingSpinner component for displaying a loading animation
 * @param {LoadingSpinnerProps} props - Component props
 * @returns {JSX.Element} The rendered component
 */
export function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );
}
