import { LoadingSpinner } from '../components/LoadingSpinner';

/**
 * Loading page component
 * @returns {JSX.Element} The rendered component
 */
export default function Loading() {
    return (<div className="flex h-screen w-full items-center justify-center">
      <LoadingSpinner size={48}/>
    </div>);
}
