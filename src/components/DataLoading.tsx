interface DataLoadingProps {
  message?: string
  className?: string
}

export default function DataLoading({ message = 'Loading...', className = '' }: DataLoadingProps) {
  return (
    <div className={`flex items-center justify-center p-4 ${className}`}>
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
        <span className="text-sm text-gray-600">{message}</span>
      </div>
    </div>
  )
} 