import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import BatchDetailClient from './BatchDetailClient';

// Simple interface without PageProps constraint
interface BatchDetailPageProps {
  params: {
    batchId: string;
  };
}

export default function BatchDetailPage({ params }: BatchDetailPageProps) {
  return (
    <Suspense fallback={
      <div className="container py-6">
        <div className="flex justify-center items-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    }>
      <BatchDetailClient batchId={params.batchId} />
    </Suspense>
  );
} 