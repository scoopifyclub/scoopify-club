'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
export default function ServiceCompletePage() {
    const { serviceId } = useParams();
    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchService = async () => {
            try {
                const response = await fetch(`/api/services/${serviceId}`);
                const data = await response.json();
                setService(data);
            }
            catch (error) {
                console.error('Error fetching service:', error);
            }
            finally {
                setLoading(false);
            }
        };
        fetchService();
    }, [serviceId]);
    if (loading) {
        return <div>Loading...</div>;
    }
    return (<div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <Card className="p-8 text-center">
          <div className="mb-6">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500"/>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Service Completed Successfully!
          </h1>
          <p className="text-gray-600 mb-8">
            Thank you for using our service. Your yard has been cleaned and maintained.
          </p>
          <div className="space-y-4">
            <Button asChild className="w-full">
              <Link href="/dashboard">Return to Dashboard</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/schedule">Schedule Another Service</Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>);
}
