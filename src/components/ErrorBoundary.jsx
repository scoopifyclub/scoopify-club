import React from 'react';

/**
 * @typedef {Object} ErrorBoundaryProps
 * @property {React.ReactNode} children - The child components to render
 * @property {React.ReactNode} [fallback] - Optional fallback component to render on error
 */

/**
 * @typedef {Object} ErrorBoundaryState
 * @property {boolean} hasError - Whether an error has occurred
 * @property {Error} [error] - The error that occurred
 */

/**
 * ErrorBoundary component for catching and handling React component errors
 * @extends {React.Component<ErrorBoundaryProps, ErrorBoundaryState>}
 */
export class ErrorBoundary extends React.Component {
    /**
     * @param {ErrorBoundaryProps} props - Component props
     */
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    /**
     * Static method to derive state from an error
     * @param {Error} error - The error that occurred
     * @returns {ErrorBoundaryState} The new state
     */
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    /**
     * Lifecycle method called when an error is caught
     * @param {Error} error - The error that occurred
     * @param {React.ErrorInfo} errorInfo - Additional error information
     */
    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    /**
     * Render method
     * @returns {React.ReactNode} The rendered component
     */
    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (<div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900">Something went wrong</h2>
              <p className="mt-2 text-sm text-gray-600">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              <button onClick={() => this.setState({ hasError: false })} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Try again
              </button>
            </div>
          </div>
        </div>);
        }
        return this.props.children;
    }
}
