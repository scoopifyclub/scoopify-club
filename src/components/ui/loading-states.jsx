// Enhanced Loading States and Skeleton Screens
import React from 'react';
import { cn } from '../../lib/utils';

// Skeleton Component
export const Skeleton = ({ className, ...props }) => (
  <div
    className={cn(
      "animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-700",
      className
    )}
    {...props}
  />
);

// Card Skeleton
export const CardSkeleton = ({ className, ...props }) => (
  <div className={cn("space-y-3", className)} {...props}>
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
    <Skeleton className="h-4 w-2/3" />
  </div>
);

// Table Row Skeleton
export const TableRowSkeleton = ({ columns = 4, className, ...props }) => (
  <div className={cn("flex space-x-4", className)} {...props}>
    {Array.from({ length: columns }).map((_, i) => (
      <Skeleton key={i} className="h-4 flex-1" />
    ))}
  </div>
);

// Profile Skeleton
export const ProfileSkeleton = ({ className, ...props }) => (
  <div className={cn("space-y-4", className)} {...props}>
    <div className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  </div>
);

// Dashboard Card Skeleton
export const DashboardCardSkeleton = ({ className, ...props }) => (
  <div className={cn("p-6 space-y-4", className)} {...props}>
    <div className="flex items-center justify-between">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-4 w-16" />
    </div>
    <Skeleton className="h-8 w-20" />
    <div className="flex items-center space-x-2">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-3 w-12" />
    </div>
  </div>
);

// Service Card Skeleton
export const ServiceCardSkeleton = ({ className, ...props }) => (
  <div className={cn("p-4 space-y-3", className)} {...props}>
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-3 w-1/2" />
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-8 w-20 rounded-md" />
    </div>
  </div>
);

// Loading Spinner
export const LoadingSpinner = ({ 
  size = "md", 
  color = "primary", 
  className, 
  ...props 
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12",
  };

  const colorClasses = {
    primary: "text-primary-500",
    secondary: "text-neutral-500",
    white: "text-white",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-current border-t-transparent",
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      {...props}
    />
  );
};

// Loading Overlay
export const LoadingOverlay = ({ 
  isLoading, 
  children, 
  message = "Loading...",
  className,
  ...props 
}) => {
  if (!isLoading) return children;

  return (
    <div className={cn("relative", className)} {...props}>
      {children}
      <div className="absolute inset-0 bg-white/80 dark:bg-neutral-900/80 flex items-center justify-center z-50">
        <div className="text-center space-y-3">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
};

// Loading Button
export const LoadingButton = ({ 
  loading, 
  children, 
  loadingText = "Loading...",
  className,
  ...props 
}) => (
  <button
    className={cn(
      "inline-flex items-center justify-center space-x-2",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      className
    )}
    disabled={loading}
    {...props}
  >
    {loading && <LoadingSpinner size="sm" />}
    <span>{loading ? loadingText : children}</span>
  </button>
);

// Page Loading
export const PageLoading = ({ message = "Loading page...", className, ...props }) => (
  <div className={cn("flex items-center justify-center min-h-[400px]", className)} {...props}>
    <div className="text-center space-y-4">
      <LoadingSpinner size="xl" />
      <p className="text-lg font-medium text-neutral-700 dark:text-neutral-300">
        {message}
      </p>
    </div>
  </div>
);

// Infinite Scroll Loading
export const InfiniteScrollLoading = ({ className, ...props }) => (
  <div className={cn("flex items-center justify-center py-8", className)} {...props}>
    <div className="flex items-center space-x-3">
      <LoadingSpinner size="md" />
      <span className="text-sm text-neutral-600 dark:text-neutral-400">
        Loading more...
      </span>
    </div>
  </div>
);

// Search Loading
export const SearchLoading = ({ className, ...props }) => (
  <div className={cn("p-4 space-y-3", className)} {...props}>
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="flex items-center space-x-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

// Chart Loading
export const ChartLoading = ({ className, ...props }) => (
  <div className={cn("p-6 space-y-4", className)} {...props}>
    <div className="flex items-center justify-between">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-4 w-16" />
    </div>
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3">
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-3 flex-1" />
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
  </div>
);

// Form Loading
export const FormLoading = ({ fields = 4, className, ...props }) => (
  <div className={cn("space-y-4", className)} {...props}>
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
    ))}
    <div className="flex space-x-3 pt-4">
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-24" />
    </div>
  </div>
);

// List Loading
export const ListLoading = ({ items = 5, className, ...props }) => (
  <div className={cn("space-y-3", className)} {...props}>
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-6 w-16" />
      </div>
    ))}
  </div>
);

// Map Loading
export const MapLoading = ({ className, ...props }) => (
  <div className={cn("relative", className)} {...props}>
    <Skeleton className="h-64 w-full rounded-lg" />
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center space-y-3 bg-white/90 dark:bg-neutral-900/90 p-4 rounded-lg">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Loading map...
        </p>
      </div>
    </div>
  </div>
);

// All components are already exported individually above 