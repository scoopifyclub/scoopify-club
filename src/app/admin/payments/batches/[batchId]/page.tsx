import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import BatchDetailClient from './BatchDetailClient';

// Define the component with direct type annotation instead of a separate interface
export default function BatchDetailPage({ 
  params 
}: { 
  params: { batchId: string } 
}) {
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