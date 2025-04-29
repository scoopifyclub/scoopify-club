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
export function LoadingSpinner({ size = 24, className = '' }) {
    return (<div className={`flex items-center justify-center ${className}`}>
      <Loader2 className="animate-spin text-primary" size={size}/>
    </div>);
}
