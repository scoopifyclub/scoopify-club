/**
 * @typedef {Object} DataLoadingProps
 * @property {string} [message='Loading...'] - The loading message to display
 * @property {string} [className=''] - Additional CSS classes to apply
 */

/**
 * DataLoading component for displaying a loading spinner with message
 * @param {DataLoadingProps} props - Component props
 * @returns {JSX.Element} The rendered component
 */
export default function DataLoading({ message = 'Loading...', className = '' }) {
    return (<div className={`flex items-center justify-center p-4 ${className}`}>
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
        <span className="text-sm text-gray-600">{message}</span>
      </div>
    </div>);
}
