'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// Create JobsList component dynamically to avoid SSR issues
const JobsList = dynamic(() => import('./components/JobsList'), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center py-8 sm:py-12">
    <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary"></div>
  </div>
});

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="p-4 sm:p-6 text-center">
      <h2 className="text-xl font-semibold text-red-600 mb-2">Something went wrong</h2>
      <p className="text-gray-600 mb-4">{error.message}</p>
      <button
        onClick={() => {
          toast.promise(resetErrorBoundary, {
            loading: 'Retrying...',
            success: 'Successfully refreshed',
            error: 'Failed to refresh'
          });
        }}
        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}

export default function JobsPage() {
  const { user, loading } = useAuth({ 
    requiredRole: 'EMPLOYEE',
    redirectTo: '/auth/login?callbackUrl=/employee/dashboard/jobs'
  });

  if (typeof window === 'undefined') {
    return null; // Return null during server-side rendering
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary 
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // Optional: Add any state reset logic here
        window.location.reload();
      }}
    >
      <Suspense fallback={
        <div className="flex justify-center items-center py-8 sm:py-12">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary"></div>
        </div>
      }>
        <JobsList user={user} />
      </Suspense>
    </ErrorBoundary>
  );
}
