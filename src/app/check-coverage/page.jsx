'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin } from 'lucide-react';
import { MapPinIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function CheckCoveragePage() {
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const checkServiceArea = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            // Here we would integrate with Google Maps API to check drive time
            // For now, we'll simulate a successful check
            const isInServiceArea = true; // This would be determined by the API
            if (isInServiceArea) {
                router.push('/signup');
            }
            else {
                setError("We're not servicing this area yet!");
            }
        }
        catch (err) {
            setError('An error occurred. Please try again.');
        }
        finally {
            setLoading(false);
        }
    };
    return (<main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <MapPin className="mx-auto h-12 w-12 text-purple-600"/>
          <h1 className="text-4xl font-bold mb-4">Check Your Service Area</h1>
          <p className="text-lg mb-8">
            Enter your address to see if we service your area. We service locations within a 30-minute drive from our base at 7655 McLaughlin Rd, Falcon, CO 80831.
          </p>
        </div>

        <form onSubmit={checkServiceArea} className="mt-8 space-y-6">
          <div>
            <label htmlFor="address" className="sr-only">
              Address
            </label>
            <input id="address" name="address" type="text" required className="relative block w-full rounded-md border-0 py-3 px-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-purple-600 sm:text-sm sm:leading-6" placeholder="Enter your address" value={address} onChange={(e) => setAddress(e.target.value)}/>
          </div>

          {error && (<div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>)}

          <div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (<>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                  Checking...
                </>) : ('Check Coverage')}
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            We service areas within a 10-minute drive from our base location.
            Don't see your area?{' '}
            <Button variant="link" className="p-0 text-purple-600">
              Join our waitlist
            </Button>
          </p>
        </div>
      </div>
    </main>);
}
