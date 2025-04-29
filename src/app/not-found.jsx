import Link from 'next/link';
import { Button } from '../components/ui/button';

/**
 * 404 Not Found page component
 * @returns {JSX.Element} The rendered component
 */
export default function NotFound() {
    return (<div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-white to-gray-100 px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <h2 className="mt-4 text-2xl font-semibold text-gray-700">Page Not Found</h2>
        <p className="mt-2 text-gray-500">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8">
          <Button asChild>
            <Link href="/">Return Home</Link>
          </Button>
        </div>
      </div>
    </div>);
}
