interface SkeletonProps {
  className?: string
  count?: number
  height?: string
  width?: string
  rounded?: boolean
}

export default function Skeleton({
  className = '',
  count = 1,
  height = '1.5rem',
  width = '100%',
  rounded = false,
}: SkeletonProps) {
  const skeletons = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={`animate-pulse bg-gray-200 ${rounded ? 'rounded-full' : 'rounded'} ${className}`}
      style={{ height, width }}
    />
  ))

  return <>{skeletons}</>
}

// Pre-built skeleton components
export function CardSkeleton() {
  return (
    <div className="p-4 border rounded-lg shadow">
      <Skeleton height="2rem" width="60%" className="mb-4" />
      <Skeleton height="1rem" className="mb-2" />
      <Skeleton height="1rem" width="80%" className="mb-2" />
      <Skeleton height="1rem" width="70%" />
    </div>
  )
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
          <Skeleton height="3rem" width="3rem" rounded />
          <div className="flex-1 space-y-2">
            <Skeleton height="1rem" width="40%" />
            <Skeleton height="1rem" width="60%" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-2">
      <div className="flex space-x-2">
        {Array.from({ length: columns }, (_, i) => (
          <Skeleton key={i} height="2rem" width="100%" className="flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex space-x-2">
          {Array.from({ length: columns }, (_, j) => (
            <Skeleton key={j} height="2rem" width="100%" className="flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
} 