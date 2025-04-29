import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import BatchDetailClient from './BatchDetailClient';
export default function BatchDetailPage(props) {
    // Extract batchId from props
    const { batchId } = props.params;
    return (<Suspense fallback={<div className="container py-6">
        <div className="flex justify-center items-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary"/>
        </div>
      </div>}>
      <BatchDetailClient batchId={batchId}/>
    </Suspense>);
}
