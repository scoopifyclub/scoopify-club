import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * @typedef {Object} GlobalErrorProps
 * @property {Error & { digest?: string }} error - The error object that occurred
 * @property {Function} reset - Function to reset the error state
 */

/**
 * GlobalError component for displaying global error states
 * @param {GlobalErrorProps} props - Component props
 * @returns {JSX.Element} The rendered component
 */
export default function GlobalError({ error, reset }) {
    const router = useRouter();
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Global error caught:', error);
    }, [error]);
    return (<div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Something went wrong!</h2>
          <p className="mt-2 text-sm text-gray-600">
            {error.message || 'An unexpected error occurred'}
          </p>
          <div className="mt-6 space-x-4">
            <button onClick={() => reset()} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Try again
            </button>
            <button onClick={() => router.push('/')} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
              Go home
            </button>
          </div>
        </div>
      </div>
    </div>);
}
